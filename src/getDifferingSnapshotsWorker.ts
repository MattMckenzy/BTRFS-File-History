import { workerData, parentPort } from 'node:worker_threads';
import { HistoryItem } from './HistoryItem';
import lineByLine from 'n-readlines';
import * as fs from 'fs';
import * as path from 'path';

function GetDifferingSnapshots(filePath: string, relativeFilePath: string, snapshotsFolder: string) 
{
	const fileHistories: HistoryItem[] = [];
	const snapshotDirents: fs.Dirent[] = fs.readdirSync(snapshotsFolder, { withFileTypes: true }).filter(item => item.isDirectory()).sort().reverse();

	for (const snapshotDirent of snapshotDirents) 
	{
		const fileHistoryPath = path.join(snapshotsFolder as string, snapshotDirent.name, relativeFilePath);
		if (fs.existsSync(fileHistoryPath)) 
		{
			let latestFileHistoryToCompare = filePath;
			if (fileHistories.length > 0) 
			{
				latestFileHistoryToCompare = fileHistories[fileHistories.length - 1].path;
			}

			try 
			{
				if (QuickDiff(latestFileHistoryToCompare, fileHistoryPath)) 
				{
					const newHistoryItem = new HistoryItem(fs.statSync(fileHistoryPath).mtime.toLocaleString(), fileHistoryPath);
					fileHistories.push(newHistoryItem);
					parentPort!.postMessage({ historyItem: newHistoryItem });
				}
			}
			catch (error: any) 
			{
				parentPort!.postMessage({ error: `There was an error while comparing file histories: ${error.message}` });
				return;
			}
		}
	}
}

// Returns true if the files differ, false if they don't, undefined if files don't exist or the cancellationToken is canceled.
function QuickDiff(filePath1: string, filePath2: string): boolean 
{
	if (fs.existsSync(filePath1 && filePath2)) 
	{
		const liner1: lineByLine = new lineByLine(filePath1);
		const liner2: lineByLine = new lineByLine(filePath2);

		let line1: false | Buffer = liner1.next();
		let line2: false | Buffer = liner2.next();

		while (line1 !== false && line2 !== false) 
		{
			if (!line1.equals(line2)) 
			{
				return true;
			}

			line1 = liner1.next();
			line2 = liner2.next();
		}

		return false;
	}

	throw new Error(`One of the files ("${filePath1}", "${filePath2}") couldn't be read.`);
}

if (parentPort &&
	typeof (workerData.filePath) === 'string' && workerData.filePath &&
	typeof (workerData.relativeFilePath) === 'string' && workerData.relativeFilePath &&
	typeof (workerData.snapshotsFolder) === 'string' && workerData.snapshotsFolder) 
{
	GetDifferingSnapshots(workerData.filePath, workerData.relativeFilePath, workerData.snapshotsFolder);
}
else if (parentPort) 
{
	parentPort!.postMessage({ error: `There was an error while comparing file histories, missing parameters!` });
}