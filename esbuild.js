// file: esbuild.js

const { build } = require("esbuild");
const fs = require('fs');
const path = require('path');

const extraFiles = [
	{
		in: "./node_modules/@vscode/codicons/dist/codicon.css",
		out: "./media/codicon/codicon.css"
	},
	{
		in: "./node_modules/@vscode/codicons/dist/codicon.ttf",
		out: "./media/codicon/codicon.ttf"
	}
];

const baseConfig = {
	bundle: true,
	minify: process.env.NODE_ENV === "production",
	sourcemap: process.env.NODE_ENV !== "production",
};

const extensionConfig = {
	...baseConfig,
	platform: "node",
	mainFields: ["module", "main"],
	format: "cjs",
	entryPoints: ["./src/extension.ts"],
	outfile: "./out/extension.js",
	external: ["vscode"],
};

const fileHistoryWebviewConfig = {
	...baseConfig,
	target: "es2020",
	format: "esm",
	entryPoints: ["./src/fileHistoryWebviewScripts.ts"],
	outfile: "./out/fileHistoryWebviewScripts.js",
};

const getDifferingSnapshotsWorker = {
	...baseConfig,
	platform: "node",
	mainFields: ["module", "main"],
	entryPoints: ["./src/getDifferingSnapshotsWorker.ts"],
	outfile: "./out/getDifferingSnapshotsWorker.js",
};

const getHistoryItemDifferencesWorkerConfig = {
	...baseConfig,
	platform: "node",
	mainFields: ["module", "main"],
	entryPoints: ["./src/getHistoryItemDifferencesWorker.ts"],
	outfile: "./out/getHistoryItemDifferencesWorker.js",
};

const watchConfig = {
	watch: {
		onRebuild(error, result)
		{
			console.log("[watch] build started");
			if (error)
			{
				error.errors.forEach(error =>
					console.error(`> ${error.location.file}:${error.location.line}:${error.location.column}: error: ${error.text}`)
				);
			} else
			{
				console.log("[watch] build finished");
			}
		},
	},
};

(async () =>
{
	const args = process.argv.slice(2);
	try
	{
		for (let extraFile of extraFiles)
		{
			fs.mkdirSync(path.dirname(extraFile.out), { recursive: true });
			fs.copyFileSync(extraFile.in, extraFile.out);
		}

		if (args.includes("--watch"))
		{
			// Build and watch extension and webview code
			console.log("[watch] build started");
			await build({
				...extensionConfig,
				...watchConfig,
			});
			await build({
				...fileHistoryWebviewConfig,
				...watchConfig,
			});
			await build({
				...getDifferingSnapshotsWorker,
				...watchConfig,
			});
			await build({
				...getHistoryItemDifferencesWorkerConfig,
				...watchConfig,
			});
			console.log("[watch] build finished");
		} 
		else
		{
			// Build extension and webview code
			await build(extensionConfig);
			await build(fileHistoryWebviewConfig);
			await build(getDifferingSnapshotsWorker);
			await build(getHistoryItemDifferencesWorkerConfig);
			console.log("build complete");
		}
	} 
	catch (err)
	{
		process.stderr.write(err.stderr);
		process.exit(1);
	}
})();