import { beforeAll, describe, expect, test } from "vitest";
import { CompletionItemKind, CompletionRequest } from "vscode-languageserver";
import completion from "./completion.js";
import schemaCompletion from "./schema-completion.js";
import { getTestClient, initializeServer, openDocument } from "../test-utils.js";


describe("Feature - $schema completion", () => {
  let client;

  beforeAll(async () => {
    client = getTestClient([completion, schemaCompletion]);
    await initializeServer(client);
  });

  test("$schema completion with string", async () => {
    const documentUri = await openDocument(client, "subject.schema.json", `{
  "$schema": ""
}`);

    /**
     * @type {import("vscode-languageserver).CompletionParams}
     */
    const params = {
      textDocument: { uri: documentUri },
      position: {
        line: 1,
        character: 14
      }
    };

    const response = await client.sendRequest(CompletionRequest, params);
    expect(response).to.eql(expectedCompletions);
  });

  test("$schema completion with colon", async () => {
    const documentUri = await openDocument(client, "subject.schema.json", `{
  "$schema":
}`);

    /**
     * @type {import("vscode-languageserver").CompletionParams}
     */
    const params = {
      textDocument: { uri: documentUri },
      position: {
        line: 1,
        character: 12
      }
    };

    const response = await client.sendRequest(CompletionRequest, params);
    expect(response).to.eql([]);
  });

  test("$schema completion with colon and space", async () => {
    const documentUri = await openDocument(client, "subject.schema.json", `{
  "$schema": 
}`);

    /**
     * @type {import("vscode-languageserver").CompletionParams}
     */
    const params = {
      textDocument: { uri: documentUri },
      position: {
        line: 1,
        character: 13
      }
    };

    const response = await client.sendRequest(CompletionRequest, params);
    expect(response).to.eql([]);
  });

  test("$schema completion without colon", async () => {
    const documentUri = await openDocument(client, "subject.schema.json", `{
  "$schema"
}`);

    /**
     * @type {import("vscode-languageserver").CompletionParams}
     */
    const params = {
      textDocument: { uri: documentUri },
      position: {
        line: 1,
        character: 11
      }
    };

    const response = await client.sendRequest(CompletionRequest, params);
    expect(response).to.eql([]);
  });
});

const expectedCompletions = [
  {
    kind: CompletionItemKind.Value,
    label: "https://json-schema.org/draft/2020-12/schema"
  },
  {
    kind: CompletionItemKind.Value,
    label: "https://json-schema.org/draft/2019-09/schema"
  },
  {
    kind: CompletionItemKind.Value,
    label: "http://json-schema.org/draft-07/schema#"
  },
  {
    kind: CompletionItemKind.Value,
    label: "http://json-schema.org/draft-06/schema#"
  },
  {
    kind: CompletionItemKind.Value,
    label: "http://json-schema.org/draft-04/schema#"
  }
];
