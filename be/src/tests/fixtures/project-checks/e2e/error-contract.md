<!-- Luồng e2e của StarCi (nháp do AI viết, status: draft, author: ai-placeholder). Đừng sửa khối starci-flow: CLI chạy đúng khối này. -->
# concept: error-contract

Một tài nguyên không có (404) và một body hỏng (400) trả cùng một dạng lỗi JSON, và không phản hồi lỗi nào lộ stack trace, đường dẫn
file hay bí mật.

Bạn khai: `endpoints.error-contract.endpoint` (một endpoint ghi, ví dụ `POST /orders`; luồng đọc `GET <path>/<id không có>`).

```yaml starci-flow
id: error-contract
needs: [endpoint]
vars:
  leak: '(\bat \S+ \(|\.(ts|js|java|cs|go|py):\d+|Traceback|Exception in thread|goroutine \d+|[Pp]assword|PRIVATE KEY)'
steps:
  - id: missing
    request: { method: GET, path: "{{endpoint.path}}/starci-missing-{{run.id}}" }
    capture: { shape: keys }
    expect:
      - { that: status, eq: 404, fail: no-404 }
      - { that: keys, exists: true, fail: not-json }
      - { that: body, notMatches: "{{leak}}", fail: stack-leaked }
  - id: broken
    request: { method: POST, path: "{{endpoint.path}}", body: '{"starci":' }
    expect:
      - { that: status, is: 4xx, fail: not-4xx }
      - { that: keys, eq: "{{shape}}", fail: shape-differs }
      - { that: body, notMatches: "{{leak}}", fail: stack-leaked }
pass: one-shape
fixtures:
  endpoint: POST /starci-test/items
  sample: '{"name":"book"}'
  good: { authz: open }
  cheats:
    - { name: framework HTML 404, app: { errors: html-404 }, fails: not-json }
    - { name: stack in the error, app: { errors: stack }, fails: stack-leaked }
```
