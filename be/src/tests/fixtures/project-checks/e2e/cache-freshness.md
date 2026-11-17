<!-- StarCi e2e flow (a draft written by an AI, status: draft, author: ai-placeholder). Do not edit the starci-flow block: the CLI runs exactly this block. -->

# concept: cache-freshness

Read (warm cache), write a new value, read at once: the new value must show; read once more: the same result.

You declare: `endpoints.cache-freshness.endpoint` (the write endpoint, for example `PUT /profile`; the flow reads with `GET` on the same path) and a `body` with a
`{{value}}` slot, for example `{"name":"{{value}}"}`: StarCi fills a new value on each run.

```yaml starci-flow
id: cache-freshness
needs: [endpoint, sample, sample.value]
vars:
  value: "{{run.id}}"
steps:
  - id: warm
    request: { method: GET, path: "{{endpoint.path}}" }
    expect:
      - { that: status, is: 2xx, fail: read-failed }
  - id: write
    request: { method: "{{endpoint.method}}", path: "{{endpoint.path}}", body: "{{sample.body}}" }
    expect:
      - { that: status, is: 2xx, fail: write-failed }
  - id: read
    request: { method: GET, path: "{{endpoint.path}}" }
    capture: { fresh: body }
    expect:
      - { that: body, contains: "{{run.id}}", fail: stale-read }
  - id: again
    request: { method: GET, path: "{{endpoint.path}}" }
    expect:
      - { that: body, eq: "{{fresh}}", fail: unstable }
pass: fresh
fixtures:
  endpoint: PUT /starci-test/profile
  sample: '{"name":"{{value}}"}'
  cheats:
    - { name: write does not clear the cache, app: { cache: stale }, fails: stale-read }
```
