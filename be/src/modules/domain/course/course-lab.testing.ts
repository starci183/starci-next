import { createHash } from "node:crypto"

/**
 * A lab@2 record the specs of the course capability share: two happy cases (the first broken by the starter and fixed by `c0-naive`, with a
 * hint and its focus lines) and three unhappy ones, the third without a reference step.
 */
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
    learnerFile: "services/orders/src/checkout.ts",
    invariants: {
        "wallet-restored": { vi: "ví về 5 triệu", en: "wallet back to 5 million" },
        "order-cancelled": { vi: "đơn bị hủy", en: "order cancelled" },
    },
    happy: [
        {
            id: "h1",
            title: { vi: "đặt hàng", en: "checkout" },
            chaos: {},
            invariants: ["order-cancelled"],
            ref: "c0-naive",
            hasReference: true,
            hints: [{ vi: "h1 gợi ý 1" }],
            focus: { file: "services/orders/src/checkout.ts", lines: [41, 45] },
        },
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
            focus: { file: "services/orders/src/checkout.ts", lines: [15, 22] },
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
    framework: {
        nestjs: { map: [{ from: "services/orders/src/checkout.ts#STEPS", to: "apps/orders/src/saga/steps.ts" }] },
    },
})

/** The shared fixture with its ladder (server-only): base c0-start, h1 fixed by c0-naive, u1 by c1, u2 by c2; u3 has no reference step. */
export const labRecordWithRungsFixture = (over: Record<string, unknown> = {}): Record<string, unknown> => {
    const record = labRecordFixture()
    const unhappy = record.unhappy as Array<Record<string, unknown>>
    return {
        ...record,
        unhappy: [{ ...unhappy[0], ref: "c1-compensate" }, { ...unhappy[1], ref: "c2-retry" }, unhappy[2]],
        rungs: [
            { tag: "c0-start", content: "// c0-start\n" },
            { tag: "c0-naive", content: "// c0\n" },
            { tag: "c1-compensate", content: "// c1\n" },
            { tag: "c2-retry", content: "// c2\n" },
        ],
        ...over,
    }
}

/** A course record the specs of the catalog share: one course of two lessons on a three-node system, as the seed standard writes it. */
export const courseRecordFixture = (): Record<string, unknown> => ({
    schema: "starci-next-seed-standard/essentials-course@1",
    id: "shop-giay",
    status: "draft",
    author: "ai-placeholder",
    title: { vi: "Shop giày của bạn", en: "Your shoe shop" },
    summary: { vi: "Một shop giày lớn dần.", en: "One shoe shop that grows." },
    lab: { name: "shop-giay" },
    system: {
        nodes: [
            { id: "orders", service: "orders", label: { vi: "Đơn hàng", en: "Orders" }, role: { vi: "nhận checkout", en: "takes the checkout" } },
            { id: "payments", service: "payments", label: { vi: "Thanh toán", en: "Payments" }, role: { vi: "trừ tiền", en: "charges" } },
            { id: "stock", service: "stock", label: { vi: "Kho", en: "Stock" }, role: { vi: "giữ hàng", en: "reserves items" } },
        ],
        edges: [
            { from: "orders", to: "payments" },
            { from: "orders", to: "stock" },
        ],
    },
    lessons: [
        { id: "saga-compensation", node: "orders", concept: "saga", terms: ["saga", "compensation"] },
        { id: "idempotency-key", node: "payments", concept: "idempotency-key", terms: ["idempotency key"] },
    ],
})

/** One file of a cut with the SHA-256 of its text, as the files record writes it. */
export const labFileFixture = (path: string, text: string): { path: string; sha256: string; text: string } => ({
    path,
    sha256: createHash("sha256").update(text, "utf8").digest("hex"),
    text,
})

/**
 * A lab files record the specs share (server-only): the c0 checkout, the NestJS version, the hidden grader under `grader/` and the twelve
 * cells of the matrix of the lab fixture (3 steps by 4 faults).
 */
export const labFilesRecordFixture = (): Record<string, unknown> => ({
    lessonId: "saga-compensation",
    base: "c0-naive",
    test: { command: "npm test", cases: "npm test -- --case {ids}", report: "reports/junit.xml", timeoutMs: 900000 },
    grader: {
        command: "npm run grader",
        into: "grader/",
        cells: ["order", "payment", "stock"].flatMap((step) =>
            ["fail-before", "lost-response", "crash", "dup"].map((fault) => ({ id: `${step}-${fault}`, step, fault })),
        ),
    },
    source: [
        labFileFixture("docker-compose.yml", "name: shop-giay\n"),
        labFileFixture("package.json", "{}\n"),
        labFileFixture("services/orders/src/checkout.ts", "// c0\n"),
    ],
    framework: { nestjs: [labFileFixture("apps/orders/src/saga/steps.ts", "// nest\n")] },
    hidden: [
        labFileFixture("grader/jest.config.js", "module.exports = {}\n"),
        labFileFixture("grader/matrix.test.ts", "// SECRET-GRADER\n"),
    ],
})
