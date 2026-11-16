<!-- Luồng e2e của StarCi (nháp do AI viết, status: draft, author: ai-placeholder). Đừng sửa khối starci-flow: CLI chạy đúng khối này. -->
# concept: cache-freshness

Đọc (cache ấm), ghi một giá trị mới, đọc ngay: phải thấy giá trị mới; đọc thêm lần nữa: cùng kết quả.

Bạn khai: `endpoints.cache-freshness.endpoint` (endpoint ghi, ví dụ `PUT /profile`; luồng đọc bằng `GET` cùng path) và `body` có chỗ
`{{value}}`, ví dụ `{"name":"{{value}}"}`: StarCi điền một giá trị mới mỗi lần chạy.

```yaml starci-flow
id: cache-freshness
needs: [endpoint, sample, sample.value]
vars:
  value: "{{run.id}}"
steps:
  - id: warm
    request: { method: GET, path: "{{endpoint.path}}" }
    expect:
      - { that: status, is: 2xx, fail: read-failed }
  - id: write
    request: { method: "{{endpoint.method}}", path: "{{endpoint.path}}", body: "{{sample.body}}" }
    expect:
      - { that: status, is: 2xx, fail: write-failed }
  - id: read
    request: { method: GET, path: "{{endpoint.path}}" }
    capture: { fresh: body }
    expect:
      - { that: body, contains: "{{run.id}}", fail: stale-read }
  - id: again
    request: { method: GET, path: "{{endpoint.path}}" }
    expect:
      - { that: body, eq: "{{fresh}}", fail: unstable }
pass: fresh
fixtures:
  endpoint: PUT /starci-test/profile
  sample: '{"name":"{{value}}"}'
  cheats:
    - { name: write does not clear the cache, app: { cache: stale }, fails: stale-read }
```
