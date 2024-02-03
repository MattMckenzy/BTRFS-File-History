// @ts-expect-error moduleResolution:nodenext issue 54523
import { provideVSCodeDesignSystem, vsCodeButton, Button } from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(vsCodeButton());

// @ts-ignore
const vscode = acquireVsCodeApi();

function openFile(index: number)
{
    vscode.postMessage({
        command: 'open',
        index: index
    });
}

function compareFile(index: number)
{
    vscode.postMessage({
        command: 'compare',
        index: index
    });
}

window.addEventListener('message', async (event: any) => {

    const message: any = event.data;

    switch (message.command) {
        case 'add-snapshot':
            var fileHistoryList = document.getElementById('fileHistoryList');
            if (fileHistoryList)
            {                
                fileHistoryList.insertAdjacentHTML('beforeend', message.historyItem.html);
                const openFileButton = document.getElementById(`openFileButton-${message.historyItem.index}`) as Button;
                openFileButton?.addEventListener("click", () => openFile(message.historyItem.index));
                const compareFileButton = document.getElementById(`compareFileButton-${message.historyItem.index}`) as Button;
                compareFileButton?.addEventListener("click", () => compareFile(message.historyItem.index));
            }
            break;

        case 'add-differences':
                var differencesDiv = document.getElementById(`differences${message.index}`);
                if (differencesDiv)
                {
                    differencesDiv.classList.remove('hide');
                }
                var additionsSpan = document.getElementById(`additions${message.index}`);
                if (additionsSpan)
                {
                    additionsSpan.innerText = message.additionsText;
                    additionsSpan.classList.add("pop-in");
                }
                var deletionsSpan = document.getElementById(`deletions${message.index}`);      
                if (deletionsSpan)
                {
                    deletionsSpan.innerText = message.deletionsText;
                    deletionsSpan.classList.add("pop-in");
                }      
            break;

        case 'update-message':
            var topMessageDiv = document.getElementById('topMessageDiv');
            var topMessage = document.getElementById('topMessage');
            if(topMessageDiv && topMessage)
            {
                topMessageDiv.classList.add("pop-out");
                await delay(300);
                topMessage.innerText = message.text;
                topMessageDiv.classList.remove("pop-out");
            }
            break;
        
        case 'remove-loader':
            var topMessageDiv = document.getElementById('topMessageDiv');
            var loader = document.getElementById('loader');
            if (topMessageDiv && loader)
            {
                topMessageDiv.removeChild(loader);
            }
            break;
    }
});


const delay = (milliseconds: number) => new Promise(response => setTimeout(response, milliseconds));
