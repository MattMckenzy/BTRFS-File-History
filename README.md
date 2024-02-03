## Features

BTRFS File History is a simple Visual Studio Code extension that makes it easy to find and compare with historical versions of a file saved in BTRFS snapshots.

The extension provides the "Get File History" context menu and command pallette commands that can be used to trigger a scan of file history snapshots. The results will be shown in a webview page where two buttons can be used to open or compar with a spcific file snapshot.

## Requirements

The extension should be cross-platform and shouldn't have any extra requirements.

## Extension Settings

This extension contributes the following settings:

* `btrfsFileHistory.snapshotPath`: Specifies the path of the BTRFS snapshots directory, typically '.snapshots' found at the subvolume root, used to get file histories.
* `btrfsFileHistory.relativePath`: Specifies the relative root of the snapshot path. In other words, the directory of which snapshots are created.
* `btrfsFileHistory.disableDifferenceProcessing`: Disables further snapshot processing to calculate file differences used to show additions and deletions.

## Known Issues

No issues known.

## Future Work

Nothing planned.

## Release Notes

## 1.1.2

- Changed the snapshot history results from a quick pick menu to a fully-featured webview.

### 1.0.2

- Initial release of BTRFS File History.