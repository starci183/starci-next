import { allowedConceptsOf, conceptGraphOf, explainOf, type ConceptGraph } from "./concept-graph.policy"
import { CONCEPTS_YAML } from "./lab-manifest.testing"

const graphOf = (text: string): ConceptGraph => {
    const read = conceptGraphOf(text)
    if (read.kind !== "read") throw new Error(read.problem)
    return read.graph
}

describe("the REF RULE on the concept graph", () => {
    const graph = graphOf(CONCEPTS_YAML)
    const saga = allowedConceptsOf(graph, "saga")

    it("allows Saga's concept and its transitive requires, in teaching order, and nothing that comes later", () => {
        expect(saga.map((node) => node.id)).toEqual([
            "request-lifecycle",
            "data-modeling",
            "transaction-acid",
            "timeout",
            "retry",
            "idempotency-key",
            "service-boundary",
            "saga",
        ])
    })

    it("explains a concept by its id, term or Vietnamese name, and a keyword through its concept", () => {
        expect(explainOf(saga, "Saga")).toMatchObject({ kind: "explained", id: "saga", matchedKeyword: null })
        expect(explainOf(saga, "  bước bù ")).toMatchObject({ kind: "explained", id: "saga", matchedKeyword: "bước bù" })
        expect(explainOf(saga, "exponential backoff")).toMatchObject({ kind: "explained", id: "retry" })
        expect(explainOf(saga, "Khoá idempotency")).toMatchObject({
            kind: "explained",
            id: "idempotency-key",
            requires: ["retry", "transaction-acid"],
        })
    })

    it("answers 'chưa học tới' for a later concept or its keyword, never saying what it is", () => {
        ;["race condition", "Race condition (lost update)", "outbox", "lost update", "message queue", "dead-letter queue", "2PC"].forEach(
            (term) => expect(explainOf(saga, term)).toEqual({ kind: "not-yet", term }),
        )
    })

    it("allows nothing for a concept the graph does not hold, and refuses a file of another schema", () => {
        expect(allowedConceptsOf(graph, "no-such-concept")).toEqual([])
        expect(conceptGraphOf(CONCEPTS_YAML.replace("essentials-concept-graph@1", "other@1")).kind).toBe("invalid")
    })
})
