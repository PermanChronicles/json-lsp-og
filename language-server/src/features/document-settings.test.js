import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { ConfigurationRequest, DidChangeTextDocumentNotification, PublishDiagnosticsNotification } from "vscode-languageserver";
import {
  getTestClient,
  closeDocument,
  initializeServer,
  openDocument
} from "../test-utils.js";
import documentSettings from "./document-settings.js";
import schemaRegistry from "./schema-registry.js";
import workspace from "./workspace.js";
import validationErrorsFeature from "./validation-errors.js";


describe("Feature - Document Settings", () => {
  let client;
  let documentUri;

  beforeAll(async () => {
    client = getTestClient([
      workspace,
      documentSettings,
      schemaRegistry,
      validationErrorsFeature
    ]);
    const init = {};
    const settings = { "defaultDialect": "https://json-schema.org/draft/2020-12/schema" };
    await initializeServer(client, init, settings);
  });

  afterAll(async () => {
    await closeDocument(client, documentUri);
  });

  test("test default dialect", async () => {
    documentUri = await openDocument(client, "subject.schema.json", `{}`);

    const diagnosticsPromise = new Promise((resolve) => {
      client.onNotification(PublishDiagnosticsNotification, (params) => {
        resolve(params.diagnostics);
      });
    });

    const params = {
      textDocument: { uri: documentUri },
      contentChanges: []
    };

    await client.sendNotification(DidChangeTextDocumentNotification, params);

    const diagnostics = await diagnosticsPromise;
    expect(diagnostics).to.eql([]);
  });

  test("test no dialect", async () => {
    documentUri = await openDocument(client, "subject.schema.json", `{}`);

    await client.onRequest(ConfigurationRequest, () => {
      return [{}];
    });

    const diagnosticsPromise = new Promise((resolve) => {
      client.onNotification(PublishDiagnosticsNotification, (params) => {
        resolve(params.diagnostics);
      });
    });

    const params = {
      textDocument: { uri: documentUri },
      contentChanges: []
    };

    await client.sendNotification(DidChangeTextDocumentNotification, params);

    const diagnostics = await diagnosticsPromise;
    expect(diagnostics[0].message).to.eql("No dialect");
  });

  test("test unknown dialect", async () => {
    documentUri = await openDocument(client, "subject.schema.json", `{"$schema":""}`);

    await client.onRequest(ConfigurationRequest, () => {
      return [{}];
    });

    const diagnosticsPromise = new Promise((resolve) => {
      client.onNotification(PublishDiagnosticsNotification, (params) => {
        resolve(params.diagnostics);
      });
    });

    const params = {
      textDocument: { uri: documentUri },
      contentChanges: []
    };

    await client.sendNotification(DidChangeTextDocumentNotification, params);

    const diagnostics = await diagnosticsPromise;
    expect(diagnostics[0].message).to.eql("Unknown dialect");
  });

  test("test unknown dialect when default dialect is unknown", async () => {
    documentUri = await openDocument(client, "subject.schema.json", `{}`);

    await client.onRequest(ConfigurationRequest, () => {
      return [{ "defaultDialect": "" }];
    });

    const diagnosticsPromise = new Promise((resolve) => {
      client.onNotification(PublishDiagnosticsNotification, (params) => {
        resolve(params.diagnostics);
      });
    });

    const params = {
      textDocument: { uri: documentUri },
      contentChanges: []
    };

    await client.sendNotification(DidChangeTextDocumentNotification, params);

    const diagnostics = await diagnosticsPromise;
    expect(diagnostics[0].message).to.eql("Unknown dialect");
  });
});
