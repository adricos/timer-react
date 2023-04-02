export interface GitTreeNode {
    path: string;
    mode: string;
    type: string;
    sha: string;
    size?: number;
    url: string;
}
