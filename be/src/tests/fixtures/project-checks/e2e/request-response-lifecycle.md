<!-- StarCi e2e flow (a draft written by an AI, status: draft, author: ai-placeholder). Do not edit the starci-flow block: the CLI runs exactly this block. -->

# concept: request-response-lifecycle

A bad request is stopped at the edge with a 4xx (never a 5xx), an incoming request id is returned, and a request without an id gets an id the service mints for each request.

You declare in `starci/project.yaml`: `endpoints.request-response-lifecycle.endpoint` is a write endpoint, for example `POST /orders`.
`starci-relay run` runs this flow against `start.baseUrl`; CI runs it with `starci-relay ci-report --e2e`.

```yaml starci-flow
id: request-response-lifecycle
needs: [endpoint]
steps:
  - id: broken
    request: { method: "{{endpoint.method}}", path: "{{endpoint.path}}", body: '{"starci":' }
    expect:
      - { that: status, lt: 500, fail: server-error }
      - { that: status, is: 4xx, fail: accepted }
  - id: echoed
    request:
      method: GET
      path: "{{endpoint.path}}"
      headers: { x-request-id: "{{run.id}}-trace" }
    expect:
      - { that: header x-request-id, eq: "{{run.id}}-trace", fail: not-echoed }
  - id: minted
    request: { method: GET, path: "{{endpoint.path}}" }
    capture: { minted: header x-request-id }
    expect:
      - { that: header x-request-id, exists: true, fail: not-minted }
  - id: minted-again
    request: { method: GET, path: "{{endpoint.path}}" }
    expect:
      - { that: header x-request-id, ne: "{{minted}}", fail: constant-id }
pass: lifecycle
fixtures:
  endpoint: POST /starci-test/items
  sample: '{"name":"book"}'
  good: { authz: open }
  cheats:
    - { name: crashes on parse, app: { validation: crash }, fails: server-error }
    - { name: one constant id, app: { requestId: constant }, fails: not-echoed }
```
