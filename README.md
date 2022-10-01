# AlwaysOpenWorkspace

Inspired by [vim-rooter](https://github.com/airblade/vim-rooter). AlwaysOpenWorkspace opens a workspace by finding the project root when you open a file.

The project root is identified by:

* being a known directory;
* or the presence of a known directory, such as a VCS directory;
* or the presence of a known file, such as a Rakefile.

Out of the box it knows about git, darcs, mercurial, bazaar, and subversion, but you can configure it to look for anything.

The workspace will not be opened if the file has been associated with any existing workspace.

# Caution
Be sure to disable "Explorer: Expand Single Folder Workspaces" in the VSCode setting. Otherwise VSCode will open the workspace for you ( AlwaysOpenWorkspace respects VSCode's decision

# Features
### Auto add folder
automatically add folders to the current workspace if there are opened files without corresponding folders. If there are no opened workspaces, a new one will be created.

### Auto remove folder
automatically remove the folder when there are no opened files in it. The last one won't be removed. It can be disabled in the setting.

### Auto close vscode
close the last editor will also close VSCode. default is false, need to enable it in the extension setting

# Known Issues
- For nodejs projects, some vscode plugins will open `package.json` and `tsconfig.json` automatically. In such a case, the auto-remove feature will fail to function because these files cannot be closed by the user.
- Sometimes auto-remove will fail to remove the unused folder. We are waiting for VS Code to support [better editor API](https://github.com/microsoft/vscode/issues/15178) to solve it.

# Debug
All logs will be shown in `Help`->`Toggle Developer Tools`

## Release Notes

### 0.10.0
- support open current folder if the pattern "./" is added to "Root Folders" setting (it's not added by default)

### 0.0.4
- Automatcally close vscode when all editors are closed

### 0.0.3
- Automatcally remove folder if all files belong to the folder are closed

### 0.0.1
- Initial release
