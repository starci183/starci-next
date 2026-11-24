/**
 * Test support for the lab@2 commands and the lab MCP: a manifest shaped like the Saga lab of the owner's spec (2 happy and 7 unhappy
 * cases on a ladder c0..c7), a concept graph cut from the content repository's, and JUnit reports.
 *
 * The ladder refs, the grader file and the framework map carry the marker `LEAKMARK`, so a spec can check that no MCP answer ever
 * carries one of them.
 */

/** The marker every field the MCP must never reveal carries. */
export const LEAK_MARKER = "LEAKMARK"

const unhappy = (
    id: string,
    ref: string,
    chaos: string,
    invariant: string,
    explain: string,
    inspect: string,
): string => `
  - id: ${id}
    title: { vi: "Case ${id}", en: "Case ${id}" }
    chaos: ${chaos}
    invariants: [${invariant}]
    ref: ${ref}
    teaches: "Bài học của ${id}"
    hints:
      - { vi: "Gợi ý 1 của ${id}" }
      - { vi: "Gợi ý 2 của ${id}" }
      - { vi: "Gợi ý 3 của ${id}" }
    mcp: { explain: [${explain}], inspect: [${inspect}] }`

/** The ladder refs of the fixture, in case order. */
export const LADDER_REFS = [
    `c1-${LEAK_MARKER}-compensate-reverse`,
    `c2-${LEAK_MARKER}-retry-undo`,
    `c3-${LEAK_MARKER}-idempotency-key`,
    `c4-${LEAK_MARKER}-durable-log`,
    `c5-${LEAK_MARKER}-ambiguous-check`,
    `c6-${LEAK_MARKER}-idempotent-checkout`,
    `c7-${LEAK_MARKER}-pivot-last`,
]

/** The base rung of the fixture. */
export const LADDER_BASE = `c0-${LEAK_MARKER}-naive`

/** The learner file of the fixture. */
export const LEARNER_FILE = "services/orders/src/saga.ts"

/** A valid lab@2 manifest, the Saga lab of the spec. `test.cases` writes the report with a node script the specs provide. */
export const manifestYaml = (overrides: { readonly testCases?: string; readonly inspectUrl?: string } = {}): string => `
schema: starci-next-labs/lab@2
lab: shop-giay
lessonId: saga-compensation
concept: saga
requires: [transaction-acid, retry, idempotency-key, service-boundary]
stack:
  language: typescript
  runtime: node@22
  test: jest
  services:
    - { id: orders,   port: 4001, db: orders,   role: "nhận checkout, chạy saga, giữ saga_log" }
    - { id: payments, port: 4002, db: payments, uses: [redis], role: "trừ tiền, hoàn tiền" }
    - { id: stock,    port: 4003, db: stock,    role: "giữ hàng, nhả hàng" }
    - { id: notify,   port: 4004, db: notify,   role: "gửi email cho khách (không gỡ được)" }
  deps:
    - { id: postgres, image: "postgres:17", role: "1 instance, mỗi service 1 database riêng" }
    - { id: redis,    image: "redis:7",     role: "idempotency key của payments" }
learnerFile: ${LEARNER_FILE}
test:
  command: npm test
  cases: "${overrides.testCases ?? "npm test -- --cases {ids}"}"
  report: reports/junit.xml
  timeoutMs: 300000
happy:
  - { id: checkout-in-stock, title: { vi: "Còn hàng", en: "In stock" }, chaos: null, invariants: [order-confirmed] }
  - { id: checkout-slow-net, title: { vi: "Mạng chậm", en: "Slow network" }, chaos: { NET_SLOW: on }, invariants: [order-confirmed] }
unhappy:${[
    unhappy(
        "out-of-stock",
        String(LADDER_REFS[0]),
        "{ STOCK_OUT: on }",
        "money-back",
        "compensating transaction",
        "wallet",
    ),
    unhappy(
        "flaky-undo",
        String(LADDER_REFS[1]),
        "{ STOCK_OUT: on, NET_FLAKY: on }",
        "money-back",
        "exponential backoff",
        "wallet",
    ),
    unhappy(
        "refund-twice",
        String(LADDER_REFS[2]),
        "{ STOCK_OUT: on, DUP_EVENT: on }",
        "refund-once",
        "idempotency-key",
        "wallet",
    ),
    unhappy(
        "crash-mid-saga",
        String(LADDER_REFS[3]),
        '{ CRASH_AT: "after:payments.charge" }',
        "nothing-pending",
        "saga log",
        "saga-log",
    ),
    unhappy(
        "timeout-ambiguous",
        String(LADDER_REFS[4]),
        "{ LOST_RESPONSE: stock.reserve }",
        "no-stuck-reservation",
        "read timeout",
        "stock",
    ),
    unhappy("double-click", String(LADDER_REFS[5]), "null", "charged-once", "idempotent", "wallet"),
    unhappy(
        "pivot-email",
        String(LADDER_REFS[6]),
        "{ STOCK_OUT: on }",
        "no-email-when-cancelled",
        "pivot step",
        "emails",
    ),
].join("")}
ladder:
  base: ${LADDER_BASE}
  refs: [${LADDER_REFS.join(", ")}]
  main: ${String(LADDER_REFS[6])}
grader:
  file: grader/${LEAK_MARKER}.grader.test.ts
  command: npm run test:grader
  matrix: { steps: [order, payment, stock], faults: [fail-before, lost-response, crash, dup] }
mcp:
  inspect:
    - { id: saga-log, url: "http://localhost:4001/lab/saga-log/{orderId}" }
    - { id: wallet,   url: "${overrides.inspectUrl ?? "http://localhost:4002/wallets/{customerId}"}" }
    - { id: stock,    url: "http://localhost:4003/items/{sku}" }
    - { id: emails,   url: "http://localhost:4004/emails?orderId={orderId}" }
framework:
  nestjs: { lab: shop-giay-nest-${LEAK_MARKER}, map: [ { from: "services/orders/src/saga.ts#STEPS", to: "apps/orders/src/saga/steps.ts" } ] }
`

/** The concept graph cut from the content repository: the Saga closure plus later concepts the REF RULE must keep out. */
export const CONCEPTS_YAML = `
schema: starci-next-seed-standard/essentials-concept-graph@1
nodes:
  - { id: request-lifecycle, term: Request lifecycle, vi: Một request đi qua hệ thống, oneLine: "Một request đi qua những ô nào.", requires: [], keywords: [HTTP, status code] }
  - { id: data-modeling, term: Data modeling, vi: Thiết kế dữ liệu, oneLine: "Chọn bảng và khoá.", requires: [request-lifecycle], keywords: [primary key, unique constraint] }
  - { id: transaction-acid, term: Transaction (ACID), vi: Transaction, oneLine: "Xong hết hoặc không có gì.", requires: [data-modeling], keywords: [atomicity, commit, rollback, durability] }
  - { id: timeout, term: Timeout, vi: Timeout, oneLine: "Giới hạn chờ cho mỗi lời gọi.", requires: [request-lifecycle], keywords: [read timeout, deadline] }
  - { id: retry, term: Retry, vi: Thử lại, oneLine: "Thử lại lỗi tạm thời.", requires: [timeout], keywords: [exponential backoff, jitter, transient error] }
  - { id: idempotency-key, term: Idempotency key, vi: Khoá idempotency, oneLine: "Gọi lại nhiều lần vẫn một kết quả.", requires: [retry, transaction-acid], keywords: [idempotent, dedup, Idempotency-Key header] }
  - { id: service-boundary, term: Service boundary, vi: Ranh giới service, oneLine: "Mỗi service giữ dữ liệu của mình.", requires: [request-lifecycle, data-modeling], keywords: [microservices, database per service] }
  - { id: saga, term: Saga, vi: Saga, kind: pattern, oneLine: "Chuỗi bước nhỏ, mỗi bước có bước bù.", requires: [service-boundary, transaction-acid, idempotency-key], keywords: [distributed transaction, compensating transaction, bước bù, orchestration, choreography, saga log, recovery, pivot step] }
  - { id: race-condition, term: Race condition (lost update), vi: Race condition, oneLine: "Hai lời ghi đè nhau.", requires: [transaction-acid], keywords: [lost update, check-then-act] }
  - { id: outbox, term: Transactional outbox, vi: Outbox, oneLine: "Ghi sự kiện cùng transaction.", requires: [saga], keywords: [outbox table, relay] }
  - { id: message-queue, term: Message queue, vi: Hàng đợi, oneLine: "Gửi việc qua hàng đợi.", requires: [service-boundary], keywords: [broker, dead-letter queue] }
`

/** A JUnit report as the lab's Jest writes it: each test tagged with its case, a failing one also with its invariant. */
export const reportXml = (tests: ReadonlyArray<{ readonly name: string; readonly failure?: string }>): string =>
    `<testsuites><testsuite name="saga">${tests
        .map((test) =>
            test.failure === undefined
                ? `<testcase name="${test.name}" time="0.1"/>`
                : `<testcase name="${test.name}" time="0.1"><failure message="${test.failure}">x</failure></testcase>`,
        )
        .join("")}</testsuite></testsuites>`

/** The failure Jest writes for `expect(wallet).toBe(5000000)` that got 3800000, with its colour codes. */
export const WALLET_FAILURE =
    "[invariant:money-back] expect(received).toBe(expected)&#10;&#10;Expected: \u001b[32m5000000\u001b[39m&#10;Received: \u001b[31m3800000\u001b[39m"
