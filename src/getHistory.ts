import * as path from 'path';
import { window, workspace, commands } from 'vscode';
import { ExtensionContext, Uri, CancellationTokenSource } from 'vscode';
import { WebviewPanel, ViewColumn } from 'vscode';
import { Worker } from "worker_threads";
import { pickFile } from './quickOpen';
import { GetUri, GetNonce, RunWorker, RunWorkerAsync, Sleep } from "./utilities";
import { GetAdditionsMessage, GetDeletionsessage, GetFileHistoryItemWebviewHtml, GetFileHistoryWebviewHtml, GetMessage } from './fileHistoryWebviewHtml';
import { HistoryItem } from './HistoryItem';

export async function getHistory(fileUri: Uri | undefined, context: ExtensionContext) 
{
	let filePath: string = '';
	if (!fileUri) 
	{
		let quickPicks: Uri | undefined = await pickFile();
		if (!quickPicks) 
		{
			window.showErrorMessage('Please select a file for which to retrieve history!');
			return;
		}
		else 
		{
			filePath = quickPicks.fsPath;
		}
	}
	else 
	{
		filePath = fileUri.path;
	}

	const snapshotsFolder: string | undefined = workspace.getConfiguration('btrfsFileHistory').get('snapshotPath');
	const relativePath: string | undefined = workspace.getConfiguration('btrfsFileHistory').get('relativePath');

	if (!snapshotsFolder) 
	{
		window.showErrorMessage('Please define the snapshots folder path in the configuration for "BTRFS Get History"');
		return;
	}

	if (!relativePath) 
	{
		window.showErrorMessage('Please define the relative folder path in the configuration for "BTRFS Get History"');
		return;
	}

	const relativeFilePath: string = path.relative(relativePath, filePath);
	if (!relativeFilePath) 
	{
		window.showErrorMessage('The file path isn\'t relative to the given relative folder path in the configuration for "BTRFS Get History"!');
		return;
	}

	let processFileDifferences: boolean = !(workspace.getConfiguration('btrfsFileHistory').get('disableDifferenceProcessing') ?? false);

	const fileHistories: HistoryItem[] = [];
	const fileName: string = path.basename(filePath);
	const fileHistoryPanel: WebviewPanel = window.createWebviewPanel(
		'btrfsFileHistory',
		`History: ${fileName}`,
		ViewColumn.One,
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots:
				[
					Uri.joinPath(context.extensionUri, 'out'),
					Uri.joinPath(context.extensionUri, 'media')
				]
		}
	);

	const nonce: string = GetNonce();
	const scriptUri: Uri = GetUri(fileHistoryPanel.webview, context.extensionUri, ["out", "fileHistoryWebviewScripts.js"]);
	const styleUri: Uri = GetUri(fileHistoryPanel.webview, context.extensionUri, ['media', 'fileHistoryWebviewStyles.css']);
	const codiconsUri: Uri = GetUri(fileHistoryPanel.webview, context.extensionUri, ['media', "codicon", 'codicon.css']);
	fileHistoryPanel.webview.html = GetFileHistoryWebviewHtml(fileName, scriptUri, styleUri, codiconsUri, fileHistoryPanel.webview.cspSource, nonce);

	// Handle messages from the webview
	fileHistoryPanel.webview.onDidReceiveMessage(
		message => 
		{
			if (typeof message !== undefined &&
				typeof message.command !== undefined &&
				typeof message.index !== undefined &&
				typeof fileHistories.at(message.index) !== undefined) 
				{
				const fileHistory: HistoryItem = fileHistories.at(message.index)!;
				switch (message.command) 
				{
					case 'open':
						commands.executeCommand('vscode.open', Uri.file(fileHistory.path));
						return;

					case 'compare':
						commands.executeCommand('vscode.diff', Uri.file(fileHistory.path), Uri.file(filePath), `Comparing ${fileName} with history from: ${fileHistory.date}`);

						return;
				}
			}
		},
		undefined,
		context.subscriptions
	);

	const cancellationTokenSource: CancellationTokenSource = new CancellationTokenSource();

	fileHistoryPanel.onDidDispose(() => 
	{
		cancellationTokenSource.cancel();
	});

	let historyItemDifferencesProcessed: number = 0;
	let historyItemDifferencesWorker: Worker | undefined;
	if (processFileDifferences)
	{
		historyItemDifferencesWorker = await RunWorkerAsync(path.join(__dirname, "getHistoryItemDifferencesWorker.js"), undefined, async (message: any) => 
		{
			if (fileHistories[message.index]) 
			{
				fileHistories[message.index].additions = message.additions;
				fileHistories[message.index].deletions = message.deletions;
	
				await fileHistoryPanel.webview.postMessage({ command: 'add-differences', index: message.index, additionsText: GetAdditionsMessage( message.additions), deletionsText: GetDeletionsessage(message.deletions) });
			}
			else if (typeof message.error === 'string' && message.error) 
			{
				window.showErrorMessage(`Couldn't get snapshot differences of "${fileName}" : ${message.error}`);
			}
			
			historyItemDifferencesProcessed++;
		}, cancellationTokenSource.token);
	}

	try 
	{
		await RunWorker(path.join(__dirname, "getDifferingSnapshotsWorker.js"), { filePath, relativeFilePath, snapshotsFolder }, async (message: any) => 
		{
			if (message.historyItem) 
			{
				const historyItem: HistoryItem = message.historyItem;
				historyItem.index = fileHistories.length;
				historyItem.html = GetFileHistoryItemWebviewHtml(historyItem);
				fileHistories.push(historyItem);
				await fileHistoryPanel.webview.postMessage({ command: 'add-snapshot', historyItem: historyItem });
				
				if (historyItemDifferencesWorker)
				{
					historyItemDifferencesWorker.postMessage({ command: 'get-differences', index: historyItem.index, filePath1: historyItem.path, filePath2: filePath });
				}
			}
			else if (typeof message.error === 'string' && message.error) 
			{
				window.showErrorMessage(`Couldn't get snapshot history of "${fileName}" : ${message.Error}`);
			}
		}, cancellationTokenSource.token);
	}
	catch (error: any) 
	{
		window.showErrorMessage(`Couldn't get snapshot history of "${fileName}" : ${error.message}`);
	}

	if (fileHistories.length > 0)
	{
		await fileHistoryPanel.webview.postMessage({ command: 'update-message', text: GetMessage(fileHistories.length, true) });

		if (historyItemDifferencesWorker)
		{
			while(historyItemDifferencesProcessed !== fileHistories.length)
			{
				await Sleep(300);
			}
		}
	}


	if (historyItemDifferencesWorker)
	{
		historyItemDifferencesWorker.postMessage({ command: 'end-processing' });
	}
	await fileHistoryPanel.webview.postMessage({ command: 'update-message', text: GetMessage(fileHistories.length) });
	await fileHistoryPanel.webview.postMessage({ command: 'remove-loader' });
}
