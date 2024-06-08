import { MarkupKind } from "vscode-languageserver";
import * as JsonNode from "../json-node.js";
import { getSchemaDocument } from "./schema-registry.js";


export default {
  onInitialize() {
    return {
      hoverProvider: true
    };
  },

  onInitialized(connection, documents) {
    connection.onHover(async ({ textDocument, position }) => {
      const document = documents.get(textDocument.uri);
      const schemaDocument = await getSchemaDocument(connection, document);
      const offset = document.offsetAt(position);
      const keyword = schemaDocument.findNodeAtOffset(offset);

      // This is a little wierd because we want the hover to be on the keyword, but
      // the annotation is actually on the value not the keyword.
      if (keyword.parent && JsonNode.typeOf(keyword.parent) === "property" && keyword.parent.children[0] === keyword) {
        return {
          contents: {
            kind: MarkupKind.Markdown,
            value: JsonNode.annotation(keyword.parent.children[1], "description").join("\n")
          },
          range: {
            start: document.positionAt(keyword.offset),
            end: document.positionAt(keyword.offset + keyword.textLength)
          }
        };
      }
    });
  }
};
