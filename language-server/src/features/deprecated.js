import { DiagnosticSeverity, DiagnosticTag } from "vscode-languageserver";
import * as JsonNode from "../json-node.js";
import { subscribe } from "../pubsub.js";


export default {
  onInitialize() {
    return {};
  },

  onInitialized() {
    subscribe("diagnostics", async (_message, { schemaDocument, diagnostics }) => {
      for (const deprecated of schemaDocument.annotatedWith("deprecated")) {
        if (JsonNode.annotation(deprecated, "deprecated").some((deprecated) => deprecated)) {
          diagnostics.push({
            instance: deprecated.parent,
            message: JsonNode.annotation(deprecated, "x-deprecationMessage").join("\n") || "deprecated",
            severity: DiagnosticSeverity.Warning,
            tags: [DiagnosticTag.Deprecated]
          });
        }
      }
    });
  }
};
