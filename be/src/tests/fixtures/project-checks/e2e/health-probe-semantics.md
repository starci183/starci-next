<!-- Luồng e2e của StarCi (nháp do AI viết, status: draft, author: ai-placeholder). Đừng sửa khối starci-flow: CLI chạy đúng khối này. -->
# concept: health-probe-semantics

`GET /health` báo sống nhanh (dưới 2 giây), và `GET /ready` là route riêng báo sẵn sàng nhận việc.

Bạn khai: `endpoints.health-probe-semantics.endpoint` (mặc định `GET /health`).

```yaml starci-flow
id: health-probe-semantics
needs: []
steps:
  - id: alive
    request: { method: GET, path: "{{endpoint.path ?? /health}}" }
    expect:
      - { that: status, eq: 200, fail: not-200 }
      - { that: ms, lte: 2000, fail: slow }
  - id: ready
    request: { method: GET, path: /ready }
    expect:
      - { that: status, eq: 200, fail: not-ready }
pass: alive-and-ready
fixtures:
  endpoint: GET /health
  cheats:
    - { name: health reports down, app: { health: down }, fails: not-200 }
    - { name: no readiness route, app: { ready: missing }, fails: not-ready }
```
