import { Uri } from "vscode";
import { HistoryItem } from './HistoryItem';

export function GetFileHistoryWebviewHtml(fileName: string, scriptUri: Uri, styleUri: Uri, codiconsUri: Uri, cspSource: string, nonce: string): string
{
	return `
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">    
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${cspSource}; style-src ${cspSource}; script-src 'nonce-${nonce}';">
       			<title>History: ${fileName}</title>
				<link href="${styleUri}" rel="stylesheet" />
				<link href="${codiconsUri}" rel="stylesheet" />
			</head>
			<body>
				<h2>Snapshot history for "${fileName}"</h2>
				<div id="topMessageDiv">
					<span id="topMessage">Scanning history for differing file snapshots...</span>					
					<div id="loader"></div>
				</div>
				<div>
					<ul id="fileHistoryList"> 
					</ul>
				</div>
				<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
			</body>
		</html>`;
}

export function GetFileHistoryItemWebviewHtml(historyItem: HistoryItem): string
{
	return `
        <li class="history-item">
            <div class="history-item-top">
                <b>${historyItem.date}</b>
				<div class="buttons">
					<vscode-button class="button" id="openFileButton-${historyItem.index}" onclick="openFile(${historyItem.index})">
						Open
						<span slot="start" class="codicon codicon-new-file"></span>
					</vscode-button>
					<vscode-button class="button" id="compareFileButton-${historyItem.index}" onclick="compareFile(${historyItem.index})">
						Compare
						<span slot="start" class="codicon codicon-diff"></span>
					</vscode-button>
				</div>
            </div>
            <div class="history-item-bottom">
				<div id="differences${historyItem.index}" class="differences hide">
					<span id="additions${historyItem.index}" class="additions"></span><span id="deletions${historyItem.index}" class="deletions"></span>
				</div>
				<i>@ ${historyItem.path}</i>
            </div>
        </li>
    `;
}

export function GetMessage(fileHistoriesLength: number, isProcessingDifferences: boolean = false): string
{
	if (isProcessingDifferences)
	{
		return `Found ${fileHistoriesLength} differing snapshots. Processing file differences...`;
	}
	else if (fileHistoriesLength === 0) 
	{
		return 'Found no differing snapshots in the file\'s history.';
	}
	else
	{
		return `Found ${fileHistoriesLength} differing snapshots. Select one to open or with which to compare.`;
	}
}

export function GetAdditionsMessage(additions: number)
{
	return `+${additions}`;
}

export function GetDeletionsessage(deletions: number)
{
	return `-${deletions}`;
}