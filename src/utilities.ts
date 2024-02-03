import { CancellationToken, Uri, Webview } from "vscode";
import { Worker } from "worker_threads";

export function GetUri(webview: Webview, extensionUri: Uri, pathList: string[]) 
{
	return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}

export function GetNonce() 
{
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	
	for (let i = 0; i < 32; i++) 
	{
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	
	return text;
}

export function RunWorker(workerFilePath: string, workerData: any, callback: (message: any) => Promise<void>,  cancellationToken: CancellationToken): Promise<any> 
{
	return new Promise((resolve, reject) => 
	{
		const worker: Worker = new Worker(workerFilePath, { workerData });
		cancellationToken.onCancellationRequested(() => worker.terminate());
		worker.on('message', async (message) => { await callback(message); });
		worker.on('error', (message) => { reject(message); });
		worker.on('exit', (code) => { resolve(code); });
	});
}

export async function RunWorkerAsync(workerFilePath: string, workerData: any, callback: (message: any) => Promise<void>,  cancellationToken: CancellationToken): Promise<Worker> 
{
	const worker: Worker = new Worker(workerFilePath, { workerData });
	cancellationToken.onCancellationRequested(() => worker.terminate());
	worker.on('message', async (message) => { await callback(message); });
	return worker;	
}

export function Sleep(milliseconds: number) 
{
	return new Promise((resolve) => 
	{
		setTimeout(resolve, milliseconds);
	});
}