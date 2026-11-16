<!-- Luồng e2e của StarCi (nháp do AI viết, status: draft, author: ai-placeholder). Đừng sửa khối starci-flow: CLI chạy đúng khối này. -->
# concept: rate-limiting

Hai mươi request đồng thời: có ít nhất một `429`, mỗi `429` kèm `Retry-After`, không có `5xx`.

Bạn khai: `endpoints.rate-limiting.endpoint` (một endpoint đọc, ví dụ `GET /products`).

```yaml starci-flow
id: rate-limiting
needs: [endpoint]
steps:
  - id: burst
    request: { method: GET, path: "{{endpoint.path}}" }
    fanOut: 20
    capture: { limited: count 429 }
    expect:
      - { that: count 5xx, eq: 0, fail: server-error }
      - { that: count 429, gte: 1, fail: no-429 }
      - { that: count 429 header retry-after, eq: "{{limited}}", fail: no-retry-after }
pass: limited
fixtures:
  endpoint: GET /starci-test/items
  cheats:
    - { name: no limiter, app: { rateLimit: none }, fails: no-429 }
    - { name: 429 without Retry-After, app: { rateLimit: no-retry-after }, fails: no-retry-after }
```
