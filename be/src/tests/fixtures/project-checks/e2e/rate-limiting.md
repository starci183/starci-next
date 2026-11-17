<!-- StarCi e2e flow (a draft written by an AI, status: draft, author: ai-placeholder). Do not edit the starci-flow block: the CLI runs exactly this block. -->

# concept: rate-limiting

Twenty simultaneous requests: at least one `429`, each `429` with `Retry-After`, and no `5xx`.

You declare: `endpoints.rate-limiting.endpoint` (a read endpoint, for example `GET /products`).

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
