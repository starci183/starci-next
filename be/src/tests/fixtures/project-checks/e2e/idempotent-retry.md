<!-- StarCi e2e flow (a draft written by an AI, status: draft, author: ai-placeholder). Do not edit the starci-flow block: the CLI runs exactly this block. -->

# concept: idempotent-retry

Resending the same `Idempotency-Key` returns the first result, the same key with another body is refused (409 or 422), and five requests with
one key sent at once do the work only once.

You declare: `endpoints.idempotent-retry.endpoint` (a write endpoint, for example `POST /payments`) and `body` (a sample JSON).

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
