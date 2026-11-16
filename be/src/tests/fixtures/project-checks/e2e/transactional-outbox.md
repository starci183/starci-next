<!-- Luồng e2e của StarCi (nháp do AI viết, status: draft, author: ai-placeholder). Đừng sửa khối starci-flow: CLI chạy đúng khối này. -->
# concept: transactional-outbox

Một lần ghi giao đúng một sự kiện. Request ghi mang header `X-StarCi-Sink`: địa chỉ sink mà app của bạn gửi sự kiện của lần ghi đó tới
(bằng relay đọc bảng outbox). Trên máy bạn CLI mở sink ở `127.0.0.1`; probe của server dùng sink công khai của StarCi.

Bạn khai: `endpoints.transactional-outbox.endpoint` (endpoint ghi) và `body`.

```yaml starci-flow
id: transactional-outbox
needs: [endpoint, sample]
steps:
  - id: write
    request:
      method: "{{endpoint.method}}"
      path: "{{endpoint.path}}"
      headers: { x-starci-sink: "{{sink.url}}" }
      body: "{{sample.body}}"
    expect:
      - { that: status, is: 2xx, fail: write-failed }
  - id: events
    sink: { within: 8000 }
    expect:
      - { that: count, gte: 1, fail: not-delivered }
      - { that: count, lte: 1, fail: delivered-twice }
pass: delivered-once
fixtures:
  endpoint: POST /starci-test/items
  sample: '{"name":"book"}'
  good: { authz: open }
  cheats:
    - { name: never publishes, app: { outbox: never }, fails: not-delivered }
    - { name: publishes twice, app: { outbox: twice }, fails: delivered-twice }
```
