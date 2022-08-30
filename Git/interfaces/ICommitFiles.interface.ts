export default interface ICommitFiles {
    newFileNotAdded: Array<string>;
    changesNotAdded: Array<string>;
    filesReadyToCommit: Array<string>;
}