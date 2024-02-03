import { parentPort } from 'node:worker_threads';
import LineByLine from 'n-readlines';
import * as fs from 'fs';
import * as fad from "fast-array-diff";
import { exit } from 'node:process';


function GetDifferences(index: number, filePath1: string, filePath2: string) 
{
	if (typeof filePath1 === 'string' && filePath1 && fs.existsSync(filePath1) &&
		typeof filePath1 === 'string' && filePath1 && fs.existsSync(filePath2)) 
	{
		const liner1: LineByLine = new LineByLine(filePath1);
		let line1: false | Buffer;
		const lines1: Buffer[] = [];
		while (line1 = liner1.next()) 
		{
			lines1.push(line1);
		}

		const liner2: LineByLine = new LineByLine(filePath2);
		let line2: false | Buffer;
		const lines2: Buffer[] = [];
		while (line2 = liner2.next()) 
		{
			lines2.push(line2);
		}

		const results: fad.DiffData<Buffer, Buffer> = fad.diff(lines1, lines2, (buffer1: Buffer , buffer2: Buffer) => { return buffer1.equals(buffer2); });

		parentPort!.postMessage({ index: index, additions: results.added.length, deletions: results.removed.length });
	}
	else
	{
		throw new Error(`One of the files ("${filePath1}", "${filePath2}") couldn't be read.`);
	}
}

let sleep = require('util').promisify(setTimeout);

async function main()
{
	if (parentPort)
	{
		let process: boolean = true;
		const differencesWorkItems: [number, string, string][] = [];

		parentPort.on('message', (message: any) =>
		{
			switch (message.command)
			{
				case 'get-differences':
					differencesWorkItems.push([message.index, message.filePath1, message.filePath2]);
					break;
				case 'end-processing':
					process = false;
					break;
			}
		});

		parentPort.on('end-processing', (message: any) =>
		{
		});

		while (process)
		{
			try
			{
				const differencesWorkItem: [number, string, string] | undefined = differencesWorkItems.pop();
				if (differencesWorkItem)
				{
					GetDifferences(differencesWorkItem[0], differencesWorkItem[1], differencesWorkItem[2]);
				}
				else
				{
					await sleep(300);
				}
			}
			catch (error: any)
			{
				parentPort!.postMessage({ error: `There was an error while getting file differences: ${error.message}` });
				return;
			}
		}
	}

	exit();
}

main();