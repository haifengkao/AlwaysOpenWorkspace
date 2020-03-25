# AlwaysOpenWorkspace

Inspired by [vim-rooter](https://github.com/airblade/vim-rooter). AlwaysOpenWorkspace opens a workspace by finding the project root when you open a file.

The project root is identified by:

* being a known directory;
* or the presence of a known directory, such as a VCS directory;
* or the presence of a known file, such as a Rakefile.

Out of the box it knows about git, darcs, mercurial, bazaar, and subversion, but you can configure it to look for anything.

The workspace will not be opened if the file has been associated with any existing workspace. 

## Release Notes

### 0.0.3
- Automatcally remove folder if all files belong to the folder are closed

### 0.0.1
- Initial release
