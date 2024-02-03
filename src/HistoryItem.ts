export class HistoryItem {
    date: string;
    path: string;
    index: number | undefined;
    html: string | undefined;
    additions: number | undefined;
    deletions: number | undefined;

    constructor(date: string, path: string) {
        this.date = date;
        this.path = path;
    }
}
