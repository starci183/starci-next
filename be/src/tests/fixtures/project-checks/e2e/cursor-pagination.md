<!-- Luồng e2e của StarCi (nháp do AI viết, status: draft, author: ai-placeholder). Đừng sửa khối starci-flow: CLI chạy đúng khối này. -->
# concept: cursor-pagination

Quy ước: `GET <path>?limit=<n>&cursor=<c>` trả `{"items":[{"id":...}],"nextCursor":...}`, mới nhất trước; `POST <path>` với body mẫu
tạo một item. Có item mới chen vào giữa hai trang thì trang sau vẫn không lặp item của trang đầu.

Bạn khai: `endpoints.cursor-pagination.endpoint` (ví dụ `GET /posts`) và `body` (JSON tạo một item).

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
