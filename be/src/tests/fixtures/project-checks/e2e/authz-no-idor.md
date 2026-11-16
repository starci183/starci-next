<!-- Luồng e2e của StarCi (nháp do AI viết, status: draft, author: ai-placeholder). Đừng sửa khối starci-flow: CLI chạy đúng khối này. -->
# concept: authz-no-idor

Quy ước của đường test: header `X-StarCi-Probe-User` mang danh tính người dùng test, không có header là ẩn danh. `POST <path>` tạo tài
nguyên và trả `{"id":...}`; `GET <path>/<id>` đọc nó. Chủ đọc được; người khác bị 403 hoặc 404; ẩn danh bị 401.

Bạn khai: `endpoints.authz-no-idor.endpoint` (ví dụ `POST /starci-test/notes`) và `body`.

```yaml starci-flow
id: authz-no-idor
needs: [endpoint, sample]
steps:
  - id: anonymous-write
    request: { method: POST, path: "{{endpoint.path}}", body: "{{sample.body}}" }
    expect:
      - { that: status, eq: 401, fail: open-without-credentials }
  - id: create
    request:
      method: POST
      path: "{{endpoint.path}}"
      headers: { x-starci-probe-user: "{{run.id}}-alice" }
      body: "{{sample.body}}"
    capture: { id: json $.id }
    expect:
      - { that: json $.id, exists: true, fail: create-failed }
  - id: owner-read
    request: { method: GET, path: "{{endpoint.path}}/{{id}}", headers: { x-starci-probe-user: "{{run.id}}-alice" } }
    expect:
      - { that: status, is: 2xx, fail: owner-refused }
  - id: other-read
    request: { method: GET, path: "{{endpoint.path}}/{{id}}", headers: { x-starci-probe-user: "{{run.id}}-bob" } }
    expect:
      - { that: status, in: [403, 404], fail: other-user-allowed }
pass: owner-only
fixtures:
  endpoint: POST /starci-test/items
  sample: '{"name":"book"}'
  cheats:
    - { name: "checks sign-in, not ownership", app: { authz: authn-only }, fails: other-user-allowed }
    - { name: no authentication, app: { authz: open }, fails: open-without-credentials }
```
