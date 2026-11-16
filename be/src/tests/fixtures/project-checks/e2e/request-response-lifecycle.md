<!-- Luồng e2e của StarCi (nháp do AI viết, status: draft, author: ai-placeholder). Đừng sửa khối starci-flow: CLI chạy đúng khối này. -->
# concept: request-response-lifecycle

Request sai bị chặn ở rìa bằng 4xx (không phải 5xx), request id đi vào được trả lại, và request không có id thì dịch vụ tự sinh id riêng cho mỗi request.

Bạn khai trong `starci/project.yaml`: `endpoints.request-response-lifecycle.endpoint` là một endpoint ghi, ví dụ `POST /orders`.
`starci-next run` chạy luồng này vào `start.baseUrl`; CI chạy nó bằng `npx @starci/next ci-report --e2e`.

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
