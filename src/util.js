export const getNode = (tree, pointer = "") => {
  let node = tree.rootNode.firstChild;

  for (const segment of pointerSegments(pointer)) {
    if (node.type === "object") {
      for (const pairNode of node.children) {
        if (pairNode.type !== "pair") {
          continue;
        }

        const propertyName = pairNode.firstChild.child(1).text;
        if (propertyName === segment) {
          node = pairNode.child(2);
        }
      }
    } else if (node.type === "array") {
      node = node.child(parseInt(segment, 10) + 1);
    } else {
      return;
    }
  }

  return node;
};

export const pointerSegments = function* (pointer) {
  if (pointer.length > 0 && pointer[0] !== "/") {
    throw Error(`Invalid JSON Pointer: '${pointer}'`);
  }

  let segmentStart = 1;
  let segmentEnd = 0;

  while (segmentEnd < pointer.length) {
    const position = pointer.indexOf("/", segmentStart);
    segmentEnd = position === -1 ? pointer.length : position;
    const segment = pointer.slice(segmentStart, segmentEnd);
    segmentStart = segmentEnd + 1;

    yield segment.toString().replace(/~1/g, "/").replace(/~0/g, "~");
  }
};

export const pointerFromUri = (uri) => {
  const fragmentPosition = uri.indexOf("#");
  const fragment = uri.slice(fragmentPosition + 1);
  return decodeURI(fragment);
};
