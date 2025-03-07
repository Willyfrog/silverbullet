export type ParseTree = {
  type?: string; // undefined === text node
  from?: number;
  to?: number;
  text?: string;
  children?: ParseTree[];
  // Only present after running addParentPointers
  parent?: ParseTree;
};

export function addParentPointers(tree: ParseTree) {
  if (!tree.children) {
    return;
  }
  for (let child of tree.children) {
    if (child.parent) {
      // Already added parent pointers before
      return;
    }
    child.parent = tree;
    addParentPointers(child);
  }
}

export function removeParentPointers(tree: ParseTree) {
  delete tree.parent;
  if (!tree.children) {
    return;
  }
  for (let child of tree.children) {
    removeParentPointers(child);
  }
}

export function findParentMatching(
  tree: ParseTree,
  matchFn: (tree: ParseTree) => boolean
): ParseTree | null {
  let node = tree.parent;
  while (node) {
    if (matchFn(node)) {
      return node;
    }
    node = node.parent;
  }
  return null;
}

export function collectNodesOfType(
  tree: ParseTree,
  nodeType: string
): ParseTree[] {
  return collectNodesMatching(tree, (n) => n.type === nodeType);
}

export function collectNodesMatching(
  tree: ParseTree,
  matchFn: (tree: ParseTree) => boolean
): ParseTree[] {
  if (matchFn(tree)) {
    return [tree];
  }
  let results: ParseTree[] = [];
  if (tree.children) {
    for (let child of tree.children) {
      results = [...results, ...collectNodesMatching(child, matchFn)];
    }
  }
  return results;
}

// return value: returning undefined = not matched, continue, null = delete, new node = replace
export function replaceNodesMatching(
  tree: ParseTree,
  substituteFn: (tree: ParseTree) => ParseTree | null | undefined
) {
  if (tree.children) {
    let children = tree.children.slice();
    for (let child of children) {
      let subst = substituteFn(child);
      if (subst !== undefined) {
        let pos = tree.children.indexOf(child);
        if (subst) {
          tree.children.splice(pos, 1, subst);
        } else {
          // null = delete
          tree.children.splice(pos, 1);
        }
      } else {
        replaceNodesMatching(child, substituteFn);
      }
    }
  }
}

export function findNodeMatching(
  tree: ParseTree,
  matchFn: (tree: ParseTree) => boolean
): ParseTree | null {
  return collectNodesMatching(tree, matchFn)[0];
}

export function findNodeOfType(
  tree: ParseTree,
  nodeType: string
): ParseTree | null {
  return collectNodesMatching(tree, (n) => n.type === nodeType)[0];
}

// Finds non-text node at position
export function nodeAtPos(tree: ParseTree, pos: number): ParseTree | null {
  if (pos < tree.from! || pos > tree.to!) {
    return null;
  }
  if (!tree.children) {
    return tree;
  }
  for (let child of tree.children) {
    let n = nodeAtPos(child, pos);
    if (n && n.text !== undefined) {
      // Got a text node, let's return its parent
      return tree;
    } else if (n) {
      // Got it
      return n;
    }
  }
  return null;
}

// Turn ParseTree back into text
export function renderToText(tree: ParseTree): string {
  let pieces: string[] = [];
  if (tree.text !== undefined) {
    return tree.text;
  }
  for (let child of tree.children!) {
    pieces.push(renderToText(child));
  }
  return pieces.join("");
}
