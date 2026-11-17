<!-- StarCi e2e flow (a draft written by an AI, status: draft, author: ai-placeholder). Do not edit the starci-flow block: the CLI runs exactly this block. -->

# concept: error-contract

A missing resource (404) and a broken body (400) answer with one JSON error shape, and no error response leaks a stack trace, a file
path or a secret.

You declare: `endpoints.error-contract.endpoint` (a write endpoint, for example `POST /orders`; the flow reads `GET <path>/<missing id>`).

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
