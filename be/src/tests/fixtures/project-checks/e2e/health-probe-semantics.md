<!-- StarCi e2e flow (a draft written by an AI, status: draft, author: ai-placeholder). Do not edit the starci-flow block: the CLI runs exactly this block. -->

# concept: health-probe-semantics

`GET /health` reports liveness fast (under 2 seconds), and `GET /ready` is a separate route that reports readiness for work.

You declare: `endpoints.health-probe-semantics.endpoint` (default `GET /health`).

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
