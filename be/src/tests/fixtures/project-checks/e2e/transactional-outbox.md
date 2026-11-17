<!-- StarCi e2e flow (a draft written by an AI, status: draft, author: ai-placeholder). Do not edit the starci-flow block: the CLI runs exactly this block. -->

# concept: transactional-outbox

One write delivers exactly one event. The write request carries the `X-StarCi-Sink` header: the sink address your app sends the event of that write to
(through a relay that reads the outbox table). On your machine the CLI opens the sink at `127.0.0.1`; the server probe uses the public StarCi sink.

You declare: `endpoints.transactional-outbox.endpoint` (the write endpoint) and `body`.

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
