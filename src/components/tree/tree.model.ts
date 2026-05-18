
export interface TreeNode<T> {
  treeId: string;
  name: string;
  parent?: TreeNode<T>;
  checked: boolean;
  expanded?: boolean;
  indeterminate?: boolean;
  depth: number;
  rows?: T[];
  children?: TreeNode<T>[];
}

export interface TreeViewerLeafNode<T> extends TreeNode<T> {
  rows: T[];
}

export type NodeRenderer<T = unknown> = (node: TreeNode<T>, isOpen: boolean, isExpandable?: boolean) => string;
export type LeafRenderer<T = unknown> = (leaf: TreeViewerLeafNode<T>) => string;