## Features

BTRFS File History is a simple Visual Studio Code extension that makes it easy to find and compare with historical versions of a file saved in BTRFS snapshots.

The extension provides the "Get File History" context menu and command pallette commands that can be used to trigger a scan of file history snapshots. The results will be shown in a quick pick menu where two buttons can be used to open or compare a spcific file snapshot.

## Requirements

The extension should be cross-platform as long as the following two commands are available:

* rg: found in the repgrap package found here: https://github.com/BurntSushi/ripgrep.
* diff: found in the essential diffutils package here: https://www.gnu.org/software/diffutils/. For windows users, this can be installed and added to PATH via git for Windows: https://git-scm.com/downloads.

## Extension Settings

This extension contributes the following settings:

* `btrfsFileHistory.snapshotPath`: Specifies the path of the BTRFS snapshots directory, typically '.snapshots' found at the subvolume root, used to get file histories.
* `btrfsFileHistory.relativePath`: Specifies the relative root of the snapshot path. In other words, the directory of which snapshots are created.

## Known Issues

Trying to open or compare a snapshot file isn't possible while the snapshots are being scanned and the quick pick list is being populated.

## Future Work

Considering changing from the quick pick menu to a web view to customize the results page more and improve interactibility.

## Release Notes

### 1.0.0

Initial release of BTRFS File History.