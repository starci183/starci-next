<!-- StarCi e2e flow (a draft written by an AI, status: draft, author: ai-placeholder). Do not edit the starci-flow block: the CLI runs exactly this block. -->

# concept: cursor-pagination

Convention: `GET <path>?limit=<n>&cursor=<c>` returns `{"items":[{"id":...}],"nextCursor":...}`, newest first; `POST <path>` with the sample body
creates an item. When a new item lands between two pages, the second page still repeats no item of the first.

You declare: `endpoints.cursor-pagination.endpoint` (for example `GET /posts`) and `body` (the JSON that creates an item).

```yaml starci-flow
id: cursor-pagination
needs: [endpoint, sample]
steps:
  - id: seed
    request: { method: POST, path: "{{endpoint.path}}", body: "{{sample.body}}" }
    fanOut: 3
    expect:
      - { that: count 2xx, eq: 3, fail: seed-failed }
  - id: first-page
    request: { method: GET, path: "{{endpoint.path}}?limit=2" }
    capture: { ids: "json $.items[*].id", cursor: json $.nextCursor }
    expect:
      - { that: json $.items.length, eq: 2, fail: limit-ignored }
      - { that: json $.nextCursor, exists: true, fail: no-cursor }
  - id: insert
    request: { method: POST, path: "{{endpoint.path}}", body: "{{sample.body}}" }
    fanOut: 2
    expect:
      - { that: count 2xx, eq: 2, fail: seed-failed }
  - id: next-page
    request: { method: GET, path: "{{endpoint.path}}?limit=2&cursor={{cursor}}" }
    expect:
      - { that: json $.items.length, gte: 1, fail: empty-page }
      - { that: "json $.items[*].id", disjoint: "{{ids}}", fail: repeated-items }
pass: stable
fixtures:
  endpoint: GET /starci-test/items
  sample: '{"name":"book"}'
  good: { authz: open }
  cheats:
    - { name: offset dressed as a cursor, app: { pagination: offset }, fails: repeated-items }
```
