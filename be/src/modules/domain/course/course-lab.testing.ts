/** A lab@2 record the specs of the course capability share: two happy cases and three unhappy ones, the third without a reference step. */
export const labRecordFixture = (): Record<string, unknown> => ({
    schema: "starci-next-seed-standard/essentials-lab@2",
    lessonId: "saga-compensation",
    lab: "shop-giay",
    concept: "saga",
    requires: ["transaction-acid", "retry"],
    allowedTerms: [{ id: "saga", term: "saga" }],
    stack: {
        language: "typescript",
        runtime: "node@22",
        test: "jest",
        services: [
            { id: "orders", port: 4001, db: "orders", role: { vi: "nhận checkout" } },
            { id: "payments", port: 4002, db: "payments", uses: ["redis"], role: { vi: "trừ tiền", en: "charges" } },
        ],
        deps: [{ id: "postgres", image: "postgres:17", role: { vi: "một instance" } }],
    },
    learnerFile: "services/orders/src/saga.ts",
    invariants: {
        "wallet-restored": { vi: "ví về 5 triệu", en: "wallet back to 5 million" },
        "order-cancelled": { vi: "đơn bị hủy", en: "order cancelled" },
    },
    happy: [
        { id: "h1", title: { vi: "đặt hàng", en: "checkout" }, chaos: {}, invariants: ["order-cancelled"] },
        { id: "h2", title: { vi: "mạng chậm", en: "slow net" }, chaos: { NET_SLOW: true }, invariants: [] },
    ],
    unhappy: [
        {
            id: "u1",
            title: { vi: "hết hàng", en: "out of stock" },
            chaos: { STOCK_OUT: 1 },
            invariants: ["wallet-restored", "order-cancelled"],
            teaches: "compensating transaction",
            hints: [{ vi: "gợi ý 1", en: "hint 1" }, { vi: "gợi ý 2", en: "hint 2" }, { vi: "gợi ý 3" }],
            hasReference: true,
        },
        {
            id: "u2",
            title: { vi: "hoàn tiền lỗi", en: "flaky undo" },
            chaos: { STOCK_OUT: 1, NET_FLAKY: "undo" },
            invariants: ["wallet-restored"],
            teaches: "retry",
            hints: [{ vi: "u2 gợi ý 1", en: "u2 hint 1" }],
            hasReference: true,
        },
        {
            id: "u3",
            title: { vi: "bấm hai lần", en: "double click" },
            chaos: {},
            invariants: [],
            teaches: "idempotency-key",
            hints: [],
            hasReference: false,
        },
    ],
    grader: {
        file: "grader/matrix.spec.ts",
        command: "npm run grade",
        matrix: { steps: ["order", "payment", "stock"], faults: ["fail-before", "lost-response", "crash", "dup"] },
    },
    framework: { nestjs: { map: [{ from: "services/orders/src/saga.ts#STEPS", to: "apps/orders/src/saga/steps.ts" }] } },
})

/** The shared fixture with its ladder (server-only): base c0, u1 fixed by c1, u2 by c2; u3 has no reference step. */
export const labRecordWithRungsFixture = (over: Record<string, unknown> = {}): Record<string, unknown> => {
    const record = labRecordFixture()
    const unhappy = record.unhappy as Array<Record<string, unknown>>
    return {
        ...record,
        unhappy: [
            { ...unhappy[0], ref: "c1-compensate" },
            { ...unhappy[1], ref: "c2-retry" },
            unhappy[2],
        ],
        rungs: [
            { tag: "c0-naive", content: "// c0\n" },
            { tag: "c1-compensate", content: "// c1\n" },
            { tag: "c2-retry", content: "// c2\n" },
        ],
        ...over,
    }
}
