// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as findUp from 'find-up';
import * as path from 'path';
import { TextDocument, Uri } from 'vscode';

var loggingEnabled = false;
var shouldAutoCloseVsCodeWhenAllEditorsAreClosed = false;

export function dumpInConsole(...args: any[]) {
    if (loggingEnabled) {
        console.log(...args);
    }
}

function shouldCloseVSCode(): boolean {
    dumpInConsole("should close", userDocuments())

    if (!shouldAutoCloseVsCodeWhenAllEditorsAreClosed) { return false; }

    return userDocuments().length <= 0;
}

export function userDocuments(): Array<Uri> {
    // TODO: textDocuements do not return all opened editors. need another API for this task
    // https://github.com/microsoft/vscode/issues/15178
    return vscode.workspace.textDocuments.map(doc => doc.uri).filter(uri => uri.scheme == 'file');
}

export function closeDeadFolders() {
    const isAutoClose: boolean | undefined = vscode.workspace.getConfiguration().get("AlwaysOpenWorkspace.autoClose");
    if (!isAutoClose) { return; }

    const docUris = userDocuments()
    if (docUris.length <= 0) { return; } // don't close the last workspace

    const liveWorkspaces = new Set(docUris.map(function (fileUrl) {
        return vscode.workspace.getWorkspaceFolder(fileUrl);
    }).filter(x => x != null)
    );

    const liveWorkspacesArray = Array.from(liveWorkspaces);
    const allWorkspaces = vscode.workspace.workspaceFolders || [];

    let diff = new Set(allWorkspaces.filter(x => !liveWorkspaces.has(x)));
    let toBeRemoved = diff.values().next().value;

    if (toBeRemoved) {
        dumpInConsole("AlwaysOpenWorkspace close workspace: ", toBeRemoved, liveWorkspacesArray, allWorkspaces, diff.values());
        vscode.workspace.updateWorkspaceFolders(toBeRemoved.index, 1);
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    const logEnabled: boolean | undefined = vscode.workspace.getConfiguration().get("AlwaysOpenWorkspace.loggingEnabled");
    if (logEnabled != undefined) {
        loggingEnabled = logEnabled
    }

    const shouldAutoCloseVSCode: boolean | undefined = vscode.workspace.getConfiguration().get("AlwaysOpenWorkspace.autoCloseVSCode");
    if (shouldAutoCloseVSCode != undefined) {
        shouldAutoCloseVsCodeWhenAllEditorsAreClosed = shouldAutoCloseVSCode;
    }

    function openWorkspace(folder: Uri, workspaceName: string) {
        vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: folder, name: workspaceName })
    }

    async function didOpenTextDocument(textDocument: TextDocument): Promise<any> {
        const isEnabled: boolean | undefined = vscode.workspace.getConfiguration().get("AlwaysOpenWorkspace.enabled");
        const logEnabled: boolean | undefined = vscode.workspace.getConfiguration().get("AlwaysOpenWorkspace.loggingEnabled");
        const rootFolders: string[] | undefined = vscode.workspace.getConfiguration().get("AlwaysOpenWorkspace.rootFolders");

        // if enabled is not defined or false then don't do anything...
        if (logEnabled != undefined) {
            loggingEnabled = logEnabled
        }

        //dumpInConsole("AlwaysOpenWorkspace log: ", vscode.workspace.name, vscode.workspace.workspaceFile, vscode.workspace.textDocuments);
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
            dumpInConsole("AlwaysOpenWorkspace has workspace just return: ", filePath);
            return;
        } // we had the workspace, nothing to do

        const dirname = path.dirname(filePath)
        for (var name of rootFolders) {

            var folderPath: string | undefined = undefined
            // handle current dir
            if (name == "./" || name == "./.") {
                folderPath = filePath
            } else {
                const typeValue = (name.slice(-1) == "/") ? 'directory' : 'file';
                folderPath = await findUp(name, { type: typeValue, cwd: dirname });
            }

            if (folderPath) {
                const parent = path.dirname(folderPath);
                const parentUrl = vscode.Uri.file(parent)
                dumpInConsole("AlwaysOpenWorkspace find folder: ", folderPath, "parent", parentUrl, "reason", name);
                openWorkspace(parentUrl, parent);
                return; // finished
            } else {
                dumpInConsole("AlwaysOpenWorkspace failed to find: ", name, folderPath);
            }
        }
    }

    const disposable = vscode.workspace.onDidOpenTextDocument(didOpenTextDocument);

    const disposable2 = vscode.workspace.onDidCloseTextDocument((textDocument) => {
        const isEnabled: boolean | undefined = vscode.workspace.getConfiguration().get("AlwaysOpenWorkspace.enabled");
        if (!isEnabled) {
            dumpInConsole("AlwaysOpenWorkspace disabled");
            return;
        }

        const fileUrl = textDocument.uri;
        if (fileUrl.scheme != 'file') { return; } // it might be git or output scheme, not a real file

        const workspace = vscode.workspace.getWorkspaceFolder(fileUrl)
        if (!workspace) { return; } // it might be workspace.json. vscode will open and close it from time to time. just ignore it

        const filePath = fileUrl.fsPath;
        dumpInConsole("AlwaysOpenWorkspace didClose: ", fileUrl, filePath);
        closeDeadFolders();

        if (shouldCloseVSCode()) {
            // the last window, just quit
            dumpInConsole("!!!!AlwaysOpenWorkspace quit: ");
            vscode.commands.executeCommand('workbench.action.quit');
        }

    });

    vscode.workspace.textDocuments.forEach(didOpenTextDocument); // open the folders for the initial file which are remembered by vscode
    closeDeadFolders(); // close the initial folders which are remembered by vscode in previous sessions

    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);

}

// this method is called when your extension is deactivated
export function deactivate() { }
