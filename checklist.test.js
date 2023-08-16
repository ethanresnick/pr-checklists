const { expect } = require("chai");
const Checklist = require("./checklist");

describe("should test newly added lines", () => {
  it("should return blank for blank input", () => {
    const result = Checklist.getOnlyAddedLines("");
    expect(result).to.equal("");
  });

  it("should return null for null input", () => {
    const result = Checklist.getOnlyAddedLines(null);
    expect(result).to.equal(null);
  });

  it("should return only added line", () => {
    const diff =
      "+ added line1\n" +
      "- removed line1\n" +
      "+ added line2\n" +
      "- removed line2\n";

    const expectedResult = "+ added line1\n" + "+ added line2\n";

    const result = Checklist.getOnlyAddedLines(diff);
    expect(result).to.equal(expectedResult);
  });
});

describe("should return checklist creation", () => {
  it("should return empty array", () => {
    const result = Checklist.getChecklist("", []);
    expect(result).to.deep.equal([]);
  });

  it("should return empty array", () => {
    const diff = "nothing matching in this diff";
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
    const diff = "create index order_number_customer_id";
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
    const diff = "create index order_number_customer_id\n" + "createIndex";
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
    const diff =
      "create index order_number_customer_id\n" +
      "Connection connection = new Connection()";
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
    const diff = "keyword1 keyword2";
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
    const diff = "keyword2";
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
    const diff = "keyword2 platypus";
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
    const result = Checklist.getFormattedChecklist([]);
    expect(result).to.equal("");
  });

  it("should return formatted checklist", () => {
    const checklist = [
      "Indexes have been created concurrently in big tables",
      [
        "Resources have been closed in finally block or using try-with-resources",
      ],
    ];

    const expectedResult =
      "**Checklist:**\n" +
      "- [ ] Indexes have been created concurrently in big tables\n" +
      "- [ ] Resources have been closed in finally block or using try-with-resources";

    const result = Checklist.getFormattedChecklist(checklist);
    expect(result).to.equal(expectedResult);
  });
});

describe("should test final check list", () => {
  it("should return final checklist", () => {
    const diff =
      "create index order_number_customer_id\n" +
      "Connection connection = new Connection()";
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

    const result = Checklist.getFinalChecklist(diff, mapping);
    expect(result).to.equal(expectedResult);
  });

  it("should handle null values gracefully", () => {
    const result = Checklist.getFinalChecklist(null, null);
    expect(result).to.equal("");
  });

  it("should handle empty diff and mapping gracefully", () => {
    const result = Checklist.getFinalChecklist("", []);
    expect(result).to.equal("");
  });
});
