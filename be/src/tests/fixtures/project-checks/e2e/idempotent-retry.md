<!-- Luồng e2e của StarCi (nháp do AI viết, status: draft, author: ai-placeholder). Đừng sửa khối starci-flow: CLI chạy đúng khối này. -->
# concept: idempotent-retry

Gửi lại cùng `Idempotency-Key` trả đúng kết quả lần đầu, cùng khoá mà khác body bị từ chối (409 hoặc 422), và năm request cùng khoá gửi
đồng thời chỉ làm việc một lần.

Bạn khai: `endpoints.idempotent-retry.endpoint` (một endpoint ghi, ví dụ `POST /payments`) và `body` (JSON mẫu).

```yaml starci-flow
id: idempotent-retry
needs: [endpoint, sample]
steps:
  - id: first
    request:
      method: "{{endpoint.method}}"
      path: "{{endpoint.path}}"
      headers: { idempotency-key: "{{run.id}}-replay" }
      body: "{{sample.body}}"
    capture: { firstBody: body }
    expect:
      - { that: status, is: 2xx, fail: first-failed }
  - id: replay
    request:
      method: "{{endpoint.method}}"
      path: "{{endpoint.path}}"
      headers: { idempotency-key: "{{run.id}}-replay" }
      body: "{{sample.body}}"
    expect:
      - { that: body, eq: "{{firstBody}}", fail: second-differs }
  - id: other-body
    request:
      method: "{{endpoint.method}}"
      path: "{{endpoint.path}}"
      headers: { idempotency-key: "{{run.id}}-replay" }
      body: '{"starci":"{{run.id}}-other"}'
    expect:
      - { that: status, in: [409, 422], fail: mismatch-accepted }
  - id: race
    request:
      method: "{{endpoint.method}}"
      path: "{{endpoint.path}}"
      headers: { idempotency-key: "{{run.id}}-race" }
      body: "{{sample.body}}"
    fanOut: 5
    expect:
      - { that: count 5xx, eq: 0, fail: server-error }
      - { that: distinct body, eq: 1, fail: duplicates-created }
pass: idempotent
fixtures:
  endpoint: POST /starci-test/items
  sample: '{"name":"book"}'
  good: { authz: open }
  cheats:
    - { name: ignores the key, app: { idempotency: none }, fails: second-differs }
    - { name: checks the key only after the write, app: { idempotency: sequential }, fails: duplicates-created }
```
