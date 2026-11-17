<!-- StarCi e2e flow (a draft written by an AI, status: draft, author: ai-placeholder). Do not edit the starci-flow block: the CLI runs exactly this block. -->

# concept: authz-no-idor

Test path convention: the `X-StarCi-Probe-User` header carries the test user's identity, and no header means anonymous. `POST <path>` creates a
resource and returns `{"id":...}`; `GET <path>/<id>` reads it. The owner can read it; another user gets 403 or 404; anonymous gets 401.

You declare: `endpoints.authz-no-idor.endpoint` (for example `POST /starci-test/notes`) and `body`.

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
