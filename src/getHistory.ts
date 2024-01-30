import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import { pickFile } from './quickOpen';
import { window, workspace, commands } from 'vscode';
import { Uri, Disposable, CancellationToken, CancellationTokenSource } from 'vscode';
import { QuickPick, QuickPickItem, QuickPickItemButtonEvent, QuickInputButton, ThemeIcon } from 'vscode';

export async function getHistory(fileUri: Uri | undefined) {

	let filePath: string = '';
	if (!fileUri) {
		let quickPicks: Uri | undefined = await pickFile();
		if (!quickPicks) {
			window.showErrorMessage('Please select a file for which to retrieve history!');
			return;
		}
		else {
			filePath = quickPicks.fsPath;
		}
	}
	else {
		filePath = fileUri.path;
	}

	const snapshotsFolder: string | undefined = workspace.getConfiguration('btrfsFileHistory').get('snapshotPath');
	const relativePath: string | undefined = workspace.getConfiguration('btrfsFileHistory').get('relativePath');

	if (!snapshotsFolder) {
		window.showErrorMessage('Please define the snapshots folder path in the configuration for "BTRFS Get History"');
		return;
	}

	if (!relativePath) {
		window.showErrorMessage('Please define the relative folder path in the configuration for "BTRFS Get History"');
		return;
	}

	const relativeFilePath = path.relative(relativePath, filePath);
	if (!relativeFilePath) {
		window.showErrorMessage('The file path isn\'t relative to the given relative folder path in the configuration for "BTRFS Get History"!');
		return;
	}

	let cancellationTokenSource: CancellationTokenSource = new CancellationTokenSource();

	const quickPick: QuickPick<HistoryItem> = window.createQuickPick<HistoryItem>();
	const disposables: Disposable[] = [quickPick];

	disposables.push(
		quickPick.onDidTriggerItemButton(async (historyItemButtonEvent: QuickPickItemButtonEvent<HistoryItem>) => {
			quickPick.hide();
			if (historyItemButtonEvent.button.tooltip && historyItemButtonEvent.button.tooltip === 'Open') {
				let openPath: Uri = Uri.file(historyItemButtonEvent.item.description);
				workspace.openTextDocument(openPath).then(doc => {
					window.showTextDocument(doc);
				});
			}
			else if (historyItemButtonEvent.button.tooltip && historyItemButtonEvent.button.tooltip === 'Compare') {
				commands.executeCommand('vscode.diff', Uri.file(filePath), Uri.file(historyItemButtonEvent.item.description), `Comparing ${path.basename(filePath)} with history from: ${historyItemButtonEvent.item.label}`);
			}
		}),
		quickPick.onDidHide(async () => {
			cancellationTokenSource.cancel();
			disposables.forEach(d => d.dispose());
		})
	);

	quickPick.ignoreFocusOut = true;
	quickPick.canSelectMany = false;
	quickPick.title = `Currently loading file histories for "${path.basename(filePath)}"...`;
	quickPick.placeholder = 'Type here to filter by date.';

	quickPick.show();

	await GetHistoryItems(filePath, relativeFilePath, snapshotsFolder!, cancellationTokenSource.token, async (historyItem: HistoryItem) => {
		quickPick.items = quickPick.items.concat([historyItem]);
		quickPick.show();
	});
	
	quickPick.title = `Select date of "${path.basename(filePath)}" history file to open or compare with current.`;
}

class HistoryItem implements QuickPickItem {
	label: string;
	description: string;
	buttons: QuickInputButton[] = [{ iconPath: new ThemeIcon('new-file'), tooltip: 'Open' }, { iconPath: new ThemeIcon('diff'), tooltip: 'Compare' }];

	constructor(public labelString: string, public descriptionString: string) {
		this.label = labelString;
		this.description = descriptionString;
	}
}

async function GetHistoryItems(filePath: string, relativeFilePath: string, snapshotsFolder: string, cancellationToken: CancellationToken, callback: (historyItem: HistoryItem) => Promise<void>) {
	const fileHistories: HistoryItem[] = [];
	const snapshotDirents: fs.Dirent[] = fs.readdirSync(snapshotsFolder, { withFileTypes: true }).filter(item => item.isDirectory()).sort().reverse();

	for (const snapshotDirent of snapshotDirents) {
		if (cancellationToken.isCancellationRequested) {
			return;
		}

		const fileHistoryPath = path.join(snapshotsFolder as string, snapshotDirent.name, relativeFilePath);
		if (fs.existsSync(fileHistoryPath)) {
			let latestFileHistoryToCompare = filePath;
			if (fileHistories.length > 0) {
				latestFileHistoryToCompare = fileHistories[fileHistories.length - 1].description;
			}

			try 
			{	const quote = process.platform === 'win32' ? '"' : '\'';
				cp.execSync(`diff -q ${quote}${latestFileHistoryToCompare}${quote} ${quote}${fileHistoryPath}${quote}`);
			}
			catch (error: any) {
				if (error.status === 1) {
					const newHistoryItem = new HistoryItem(fs.statSync(fileHistoryPath).mtime.toLocaleString(), fileHistoryPath);
					fileHistories.push(newHistoryItem);
					await callback(newHistoryItem);
				}
				else {
					window.showErrorMessage(`There was an error while comparing file histories: ${error.message}`);
					return;
				}
			}
		}
	}
}