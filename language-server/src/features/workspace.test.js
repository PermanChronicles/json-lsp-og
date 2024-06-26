import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  closeDocument,
  getTestClient,
  initializeServer,
  openDocument,
  setupWorkspace,
  tearDownWorkspace
} from "../test-utils.js";
import {
  DidChangeTextDocumentNotification,
  DidChangeWatchedFilesNotification,
  PublishDiagnosticsNotification,
  WorkDoneProgress,
  WorkDoneProgressCreateRequest
} from "vscode-languageserver";
import { resolveIri } from "@hyperjump/uri";
import documentSettings from "./document-settings.js";
import schemaRegistry from "./schema-registry.js";
import workspace from "./workspace.js";


describe("Feature - workspace", () => {
  let client;
  let capabilities;
  let workspaceFolder;

  beforeAll(async () => {
    client = getTestClient([workspace, documentSettings, schemaRegistry]);

    workspaceFolder = await setupWorkspace({
      "subject.schema.json": `{ "$schema": "https://json-schema.org/draft/2020-12/schema" }`
    });

    /**
     * @type {import("vscode-languageserver").InitializeParams}
     */
    const init = {
      workspaceFolders: [
        { uri: workspaceFolder }
      ]
    };
    capabilities = await initializeServer(client, init);
  });

  afterAll(async () => {
    await tearDownWorkspace(workspaceFolder);
  });

  test("capabilities", async () => {
    expect(capabilities.workspace).to.eql({
      workspaceFolders: {
        changeNotifications: true,
        supported: true
      }
    });
  });

  describe("changing an open schema", () => {
    let documentUri;

    beforeAll(async () => {
      documentUri = resolveIri("./subject.schema.json", `${workspaceFolder}/`);
      await openDocument(client, documentUri);
    });

    afterAll(async () => {
      await closeDocument(client, documentUri);
    });

    test("should validate it", async () => {
      const diagnostics = new Promise((resolve) => {
        client.onNotification(PublishDiagnosticsNotification, (params) => {
          resolve(params.uri);
        });
      });

      /**
       * @type {import("vscode-languageserver").DidChangeTextDocumentParams}
       */
      const params = {
        textDocument: { uri: documentUri },
        contentChanges: []
      };
      await client.sendNotification(DidChangeTextDocumentNotification, params);

      expect(await diagnostics).to.equal(documentUri);
    });
  });

  test("a change to a watched file should validate the workspace", async () => {
    const validatedSchemas = new Promise((resolve) => {
      let schemaUris;

      client.onRequest(WorkDoneProgressCreateRequest, ({ token }) => {
        client.onProgress(WorkDoneProgress, token, ({ kind }) => {
          if (kind === "begin") {
            schemaUris = [];
          } else if (kind === "end") {
            resolve(schemaUris);
          }
        });
      });

      client.onNotification(PublishDiagnosticsNotification, (params) => {
        schemaUris.push(params.uri);
      });
    });

    /**
     * @type {import("vscode-languageserver").DidChangeWatchedFilesParams}
     */
    const params = { changes: [] };
    await client.sendNotification(DidChangeWatchedFilesNotification, params);

    expect(await validatedSchemas).to.eql([
      resolveIri("./subject.schema.json", `${workspaceFolder}/`)
    ]);
  });

  test.todo("changing the workspace folders should validate the workspace", () => {
    // DidChangeWorkspaceFoldersNotification
  });
});
