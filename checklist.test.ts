import chai from "chai";
import * as Checklist from "./checklist.js";

const { expect } = chai;

describe("should return checklist creation", () => {
  it("should return empty array", () => {
    const result = Checklist.getChecklist(new Map(), []);
    expect(result).to.deep.equal([]);
  });

  it("should return empty array", () => {
    const diff = new Map();
    const mapping = [
      {
        triggers: ["create index", "createIndex"],
        items: ["Indexes have been created concurrently in big tables"],
      },
      {
        triggers: [
          "connection",
          "session",
          "CloseableHttpClient",
          "HttpClient",
        ],
        items: [
          "Resources have been closed in finally block or using try-with-resources",
        ],
      },
    ];

    const result = Checklist.getChecklist(diff, mapping);
    expect(result).to.deep.equal([]);
  });

  it("should return items for create index", () => {
    const diff = new Map([
      ["index.js", "create index order_number_customer_id"],
    ]);

    const mapping = [
      {
        triggers: ["create index", "createIndex"],
        items: ["Indexes have been created concurrently in big tables"],
      },
      {
        triggers: [
          "connection",
          "session",
          "CloseableHttpClient",
          "HttpClient",
        ],
        items: [
          "Resources have been closed in finally block or using try-with-resources",
        ],
      },
    ];

    const result = Checklist.getChecklist(diff, mapping);
    expect(result).to.deep.equal([
      "Indexes have been created concurrently in big tables",
    ]);
  });

  it("should return items for create index even if multiple matches for same", () => {
    const diff = new Map([
      ["index.js", "create index order_number_customer_id\n" + "createIndex"],
    ]);

    const mapping = [
      {
        triggers: ["create index", "createIndex"],
        items: ["Indexes have been created concurrently in big tables"],
      },
      {
        triggers: [
          "connection",
          "session",
          "CloseableHttpClient",
          "HttpClient",
        ],
        items: [
          "Resources have been closed in finally block or using try-with-resources",
        ],
      },
    ];

    const result = Checklist.getChecklist(diff, mapping);
    expect(result).to.deep.equal([
      "Indexes have been created concurrently in big tables",
    ]);
  });

  it("should return items for all matching triggers", () => {
    const diff = new Map([
      ["fileA.js", "create index order_number_customer_id\n"],
      ["fileB.js", "Connection connection = new Connection()"],
    ]);

    const mapping = [
      {
        triggers: ["create index", "createIndex"],
        items: ["Indexes have been created concurrently in big tables"],
      },
      {
        triggers: [
          "connection",
          "session",
          "CloseableHttpClient",
          "HttpClient",
        ],
        items: [
          "Resources have been closed in finally block or using try-with-resources",
        ],
      },
      {
        triggers: ["RequestMapping", "GetMapping", "PostMapping", "PutMapping"],
        items: ["Endpoint URLs exposed by application use only small case"],
      },
      {
        triggers: ["keyword1", "keyword2"],
        items: ["Expert items"],
      },
    ];

    const result = Checklist.getChecklist(diff, mapping);
    expect(result).to.deep.equal([
      "Indexes have been created concurrently in big tables",
      "Resources have been closed in finally block or using try-with-resources",
    ]);
  });

  it("should return multiple items for triggers with multiple checklist items defined", () => {
    const diff = new Map([["index.js", "keyword1 keyword2"]]);
    const mapping = [
      {
        triggers: ["create index", "createIndex"],
        items: ["Indexes have been created concurrently in big tables"],
      },
      {
        triggers: [
          "connection",
          "session",
          "CloseableHttpClient",
          "HttpClient",
        ],
        items: [
          "Resources have been closed in finally block or using try-with-resources",
        ],
      },
      {
        triggers: ["RequestMapping", "GetMapping", "PostMapping", "PutMapping"],
        items: ["Endpoint URLs exposed by application use only small case"],
      },
      {
        triggers: ["keyword1", "keyword2"],
        items: ["checklist item 1", "checklist item 2"],
      },
    ];

    const result = Checklist.getChecklist(diff, mapping);
    expect(result).to.deep.equal(["checklist item 1", "checklist item 2"]);
  });

  it("should return always triggers no matter what the diff says", () => {
    const diff = new Map([["index.js", "keyword2"]]);
    const mapping = [
      {
        triggers: ["always"],
        items: ["this should always happen", "this should also always happen"],
      },
      {
        triggers: [
          "connection",
          "session",
          "CloseableHttpClient",
          "HttpClient",
        ],
        items: [
          "Resources have been closed in finally block or using try-with-resources",
        ],
      },
      {
        triggers: ["RequestMapping", "GetMapping", "PostMapping", "PutMapping"],
        items: ["Endpoint URLs exposed by application use only small case"],
      },
      {
        triggers: ["keyword1", "keyword2"],
        items: ["checklist item 1", "checklist item 2"],
      },
    ];

    const result = Checklist.getChecklist(diff, mapping);
    expect(result).to.deep.equal([
      "this should always happen",
      "this should also always happen",
      "checklist item 1",
      "checklist item 2",
    ]);
  });

  it("supports regex triggers", () => {
    const diff = new Map([["index.js", "keyword2 platypus"]]);
    const mapping = [
      {
        triggers: [
          "connection",
          "session",
          "CloseableHttpClient",
          "HttpClient",
        ],
        items: [
          "Resources have been closed in finally block or using try-with-resources",
        ],
      },
      {
        triggers: ["RequestMapping", "GetMapping", "PostMapping", "PutMapping"],
        items: ["Endpoint URLs exposed by application use only small case"],
      },
      {
        triggers: ["keyword\\d"],
        items: ["checklist item 1", "checklist item 2"],
      },
      {
        triggers: ["platypus|bear"],
        items: ["checklist item 3"],
      },
    ];

    const result = Checklist.getChecklist(diff, mapping);
    expect(result).to.deep.equal([
      "checklist item 1",
      "checklist item 2",
      "checklist item 3",
    ]);
  });
});

describe("should test formatting of check list", () => {
  it("should return blank for empty checklist array", () => {
    const result = Checklist.formatChecklist([]);
    expect(result).to.equal("");
  });

  it("should return formatted checklist", () => {
    const checklist = [
      "Indexes have been created concurrently in big tables",
      "Resources have been closed in finally block or using try-with-resources",
    ];

    const expectedResult =
      "**Checklist:**\n" +
      "- [ ] Indexes have been created concurrently in big tables\n" +
      "- [ ] Resources have been closed in finally block or using try-with-resources";

    const result = Checklist.formatChecklist(checklist);
    expect(result).to.equal(expectedResult);
  });
});

describe("should test final check list", () => {
  it("should return final checklist", () => {
    const diffString = `
diff --git a/a.txt b/a.txt
index 7898192..7e8a165 100644
--- a/a.txt
+++ b/a.txt
@@ -1 +1,2 @@
  a
+create index connection
`;

    const mapping = [
      {
        triggers: ["create index", "createIndex"],
        items: ["Indexes have been created concurrently in big tables"],
      },
      {
        triggers: [
          "connection",
          "session",
          "CloseableHttpClient",
          "HttpClient",
        ],
        items: [
          "Resources have been closed in finally block or using try-with-resources",
        ],
      },
      {
        triggers: ["RequestMapping", "GetMapping", "PostMapping", "PutMapping"],
        items: ["Endpoint URLs exposed by application use only small case"],
      },
      {
        triggers: ["keyword1", "keyword2"],
        items: ["Expert items"],
      },
    ];
    const expectedResult =
      "**Checklist:**\n" +
      "- [ ] Indexes have been created concurrently in big tables\n" +
      "- [ ] Resources have been closed in finally block or using try-with-resources";

    const result = Checklist.getFormattedChecklist(diffString, mapping);
    expect(result).to.equal(expectedResult);
  });

  it("should handle null values gracefully", () => {
    const result = Checklist.getFormattedChecklist(null, null);
    expect(result).to.equal("");
  });

  it("should handle empty diff and mapping gracefully", () => {
    const result = Checklist.getFormattedChecklist("", []);
    expect(result).to.equal("");
  });
});
