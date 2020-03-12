// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as findUp from 'find-up';
import * as path from 'path';

var loggingEnabled = false;

export function dumpInConsole(...args: any[]) {
    if (loggingEnabled) {
        console.log(...args);
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "AlwaysOpenWorkspace" is now active!');

    const disposable = vscode.workspace.onDidOpenTextDocument( async (textDocument) => {
        const isEnabled: boolean | undefined = vscode.workspace.getConfiguration().get("AlwaysOpenWorkspace.enabled");
        const logEnabled: boolean | undefined  = vscode.workspace.getConfiguration().get("AlwaysOpenWorkspace.loggingEnabled");
        const rootFolders: string[] | undefined  = vscode.workspace.getConfiguration().get("AlwaysOpenWorkspace.rootFolders");
    
        // if enabled is not defined or false then don't do anything...
        if (logEnabled != undefined) {
            loggingEnabled = logEnabled
        }

        if (!isEnabled) {
            dumpInConsole("AlwaysOpenWorkspace disabled");
            return;
        }

        if (!rootFolders) { 
            dumpInConsole("AlwaysOpenWorkspace rootFolders are not set");
            return;
        }

        const fileUrl = textDocument.uri;
        const filePath = fileUrl.fsPath;

        if (fileUrl.scheme != 'file') { return; } // it might be git or output scheme, not a real file

        dumpInConsole("AlwaysOpenWorkspace didOpen: ", fileUrl, filePath);
        const workspace = vscode.workspace.getWorkspaceFolder(fileUrl)
        if (workspace) { 
            dumpInConsole("AlwaysOpenWorkspace has worksapce just return: ", filePath);
            return; 
        } // we had the worksapce, nothing to do

        const dirname = path.dirname(filePath)
        for (var name of rootFolders) { 
            const typeValue = (name.slice(-1) == "/") ? 'directory' : 'file';
            const folderPath = await findUp(name, {type: typeValue, cwd: dirname});
            if (folderPath) {
                const parent = path.dirname(folderPath);
                const parentUrl = vscode.Uri.file(parent)
                dumpInConsole("AlwaysOpenWorkspace find folder: ", folderPath, parentUrl);
                vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: parentUrl, name: parent})
                return; // finished
            } else { 
                dumpInConsole("AlwaysOpenWorkspace failed to find: ", name, folderPath);
            }
        }
    });

    const disposable2 = vscode.workspace.onDidCloseTextDocument((textDocument) => {
        const isEnabled: boolean | undefined = vscode.workspace.getConfiguration().get("AlwaysOpenWorkspace.enabled");
        if (!isEnabled) {
            dumpInConsole("AlwaysOpenWorkspace disabled");
            return;
        }

        const fileUrl = textDocument.uri;
        const filePath = fileUrl.path;
        const workspace = vscode.workspace.getWorkspaceFolder(fileUrl)
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
}

// this method is called when your extension is deactivated
export function deactivate() {}
