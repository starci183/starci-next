import {
    caseOf,
    casesCommandOf,
    casesOf,
    casesThroughOf,
    courseOf,
    labManifestOf,
    rungsOf,
    type LabManifest,
} from "./lab-manifest.policy"
import { LADDER_BASE, LADDER_REFS, manifestYaml } from "./lab-manifest.testing"

const readOf = (text: string): LabManifest => {
    const read = labManifestOf(text)
    if (read.kind !== "read") throw new Error(read.problems.join("\n"))
    return read.manifest
}

const problemsOf = (text: string): ReadonlyArray<string> => {
    const read = labManifestOf(text)
    return read.kind === "invalid" ? read.problems : []
}

describe("labManifestOf (lab@2)", () => {
    it("reads the Saga manifest of the spec whole: 2 happy then 7 unhappy cases, the course defaulting to the lab", () => {
        const manifest = readOf(manifestYaml())

        expect(casesOf(manifest).map((item) => `${item.kind}:${item.id}`)).toEqual([
            "happy:checkout-in-stock",
            "happy:checkout-slow-net",
            "unhappy:out-of-stock",
            "unhappy:flaky-undo",
            "unhappy:refund-twice",
            "unhappy:crash-mid-checkout",
            "unhappy:timeout-ambiguous",
            "unhappy:double-click",
            "unhappy:pivot-email",
        ])
        expect(manifest.stack.services.map((service) => service.port)).toEqual([4001, 4002, 4003, 4004])
        expect(courseOf(manifest)).toBe("shop-giay")
    })

    it("refuses another schema, which is how a lab@1 file is told apart, with one plain problem", () => {
        expect(problemsOf(manifestYaml().replace("lab@2", "lab@1"))).toEqual([
            "schema is starci-next-labs/lab@1; this relay reads starci-next-labs/lab@2 only",
        ])
        expect(problemsOf("schema: [")).toHaveLength(1)
    })

    it("refuses an inspect url off loopback, a case with two hints and a ladder out of the cases' order, all at once", () => {
        const ladderSwapped = manifestYaml().replace(
            `refs: [${LADDER_REFS.join(", ")}]`,
            `refs: [${[LADDER_REFS[1], LADDER_REFS[0], ...LADDER_REFS.slice(2)].join(", ")}]`,
        )
        expect(problemsOf(ladderSwapped).join("\n")).toContain(
            "ladder.refs must list the normal cases' fix, then the unhappy cases' refs in the same order",
        )

        expect(
            problemsOf(manifestYaml({ inspectUrl: "http://example.com/wallets/{customerId}" })).join("\n"),
        ).toContain("mcp.inspect.1.url")
        const twoHints = manifestYaml().replace('      - { vi: "Gợi ý 3 của out-of-stock" }\n', "")
        expect(problemsOf(twoHints).join("\n")).toContain("unhappy.0.hints")
    })

    it("refuses a ladder ref a shell or git would read as more than a name, and a cases command without {ids}", () => {
        expect(problemsOf(manifestYaml().replace(`base: ${LADDER_BASE}`, "base: c0..main")).join("\n")).toContain(
            "ladder.base",
        )
        expect(problemsOf(manifestYaml().replace(`base: ${LADDER_BASE}`, "base: c0;rm")).join("\n")).toContain(
            "ladder.base",
        )
        expect(problemsOf(manifestYaml({ testCases: "npm test" })).join("\n")).toContain("test.cases")
    })
})

describe("the cases of a manifest", () => {
    const manifest = readOf(manifestYaml())

    it("runs a case with every case before it, and fills the cases command with their ids", () => {
        const cases = casesThroughOf(manifest, "out-of-stock")

        expect(cases.map((item) => item.id)).toEqual(["checkout-in-stock", "checkout-slow-net", "out-of-stock"])
        expect(casesCommandOf(manifest, cases)).toBe(
            "npm test -- --cases checkout-in-stock,checkout-slow-net,out-of-stock",
        )
        expect(casesThroughOf(manifest, "nope")).toEqual([])
        expect(caseOf(manifest, "nope")).toBeUndefined()
    })

    it("spans a case's reference diff from the rung before its fix to its own rung; a happy case has none", () => {
        expect(rungsOf(manifest, "out-of-stock")).toEqual({ from: LADDER_BASE, to: LADDER_REFS[0] })
        expect(rungsOf(manifest, "flaky-undo")).toEqual({ from: LADDER_REFS[0], to: LADDER_REFS[1] })
        expect(rungsOf(manifest, "checkout-in-stock")).toBeUndefined()
    })

    it("reads a starter that breaks the normal cases: they span base to their shared fix, the first unhappy case starts from it", () => {
        const naive = "c0-fix-naive"
        const text = manifestYaml()
            .replace(`refs: [${LADDER_REFS.join(", ")}]`, `refs: [${[naive, ...LADDER_REFS].join(", ")}]`)
            .replaceAll("invariants: [order-confirmed] }\n", `invariants: [order-confirmed], ref: ${naive} }\n`)
        const broken = readOf(text)

        expect(rungsOf(broken, "checkout-in-stock")).toEqual({ from: LADDER_BASE, to: naive })
        expect(rungsOf(broken, "checkout-slow-net")).toEqual({ from: LADDER_BASE, to: naive })
        expect(rungsOf(broken, "out-of-stock")).toEqual({ from: naive, to: LADDER_REFS[0] })
        expect(problemsOf(text.replace(`refs: [${naive}, `, "refs: ["))).toEqual([
            expect.stringContaining("ladder.refs must list the normal cases' fix"),
        ])
    })
})
