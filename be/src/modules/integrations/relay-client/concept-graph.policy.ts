import { parse } from "yaml"
import { z } from "zod"

/**
 * The Essentials concept graph (`raw/essentials/_graph/concepts.yaml` of the content repository, schema
 * `starci-next-seed-standard/essentials-concept-graph@1`) as the relay reads it, and the REF RULE built on it.
 *
 * The REF RULE (owner): everything a learner reads about a lesson may name only the lesson's own concept, its keywords and the
 * transitive `requires` of that concept in the graph. A term outside that set belongs to a later lesson; naming it would either
 * teach it out of order or send the learner to a fix the course has not given them the tools for yet. The MCP holds the rule in
 * two places: `explain` answers only a term of the allowed set, and `lesson_context` hands the set to the editor's model with an
 * instruction to keep to it.
 */

/** The schema id of the graph file. */
export const CONCEPT_GRAPH_SCHEMA_ID = "starci-next-seed-standard/essentials-concept-graph@1"

/** The words a node is known by. Only the fields the relay reads are declared; the rest of a node is ignored. */
const NODE = z.object({
    id: z.string().min(1),
    term: z.string().min(1),
    vi: z.string().min(1).optional(),
    kind: z.string().optional(),
    oneLine: z.string().min(1),
    requires: z.array(z.string()).default([]),
    keywords: z.array(z.string()).default([]),
})

const GRAPH = z.object({ schema: z.literal(CONCEPT_GRAPH_SCHEMA_ID), nodes: z.array(NODE).min(1) })

/** One concept of the graph. */
export type ConceptNode = z.infer<typeof NODE>

/** The graph: its nodes in teaching order. */
export type ConceptGraph = z.infer<typeof GRAPH>

/** What reading a graph file came to. */
export type ConceptGraphRead =
    | { readonly kind: "read"; readonly graph: ConceptGraph }
    | { readonly kind: "invalid"; readonly problem: string }

/** Reads the text of a concepts.yaml; never throws. */
export const conceptGraphOf = (text: string): ConceptGraphRead => {
    try {
        const checked = GRAPH.safeParse(parse(text))
        return checked.success
            ? { kind: "read", graph: checked.data }
            : {
                  kind: "invalid",
                  problem: checked.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
              }
    } catch (error) {
        return { kind: "invalid", problem: `not YAML: ${String(error).slice(0, 300)}` }
    }
}

/**
 * The concepts a lesson may name: its own concept and every concept it requires, transitively, in the graph's teaching order.
 * Empty when the concept is not in the graph, so a lesson whose concept is unknown explains nothing rather than everything.
 */
export const allowedConceptsOf = (graph: ConceptGraph, conceptId: string): ReadonlyArray<ConceptNode> => {
    const byId = new Map(graph.nodes.map((node) => [node.id, node]))
    if (!byId.has(conceptId)) return []
    const seen = new Set<string>()
    const visit = (id: string): void => {
        if (seen.has(id)) return
        const node = byId.get(id)
        if (node === undefined) return
        seen.add(id)
        node.requires.forEach((required) => visit(required))
    }
    visit(conceptId)
    // The graph lists nodes in teaching order; keeping it lets the assistant read the set from the basics up.
    return graph.nodes.filter((node) => seen.has(node.id))
}

/** The allowed set as the editor's model reads it: each concept with the words it may use for it. */
export interface AllowedConcept {
    readonly id: string
    readonly term: string
    readonly vi: string | null
    readonly keywords: ReadonlyArray<string>
}

/** The allowed set in the shape `lesson_context` returns. */
export const allowedSetOf = (nodes: ReadonlyArray<ConceptNode>): ReadonlyArray<AllowedConcept> =>
    nodes.map((node) => ({ id: node.id, term: node.term, vi: node.vi ?? null, keywords: node.keywords }))

/** A term as it is compared: lowercase, single spaces, no surrounding quotes. Learners type terms many ways. */
const normalOf = (term: string): string =>
    term
        .trim()
        .replaceAll(/^["'`]+|["'`]+$/gu, "")
        .replaceAll(/\s+/gu, " ")
        .toLowerCase()

/** The answer of `explain`. */
export type ExplainAnswer =
    | {
          readonly kind: "explained"
          readonly id: string
          readonly term: string
          readonly vi: string | null
          readonly oneLine: string
          readonly keywords: ReadonlyArray<string>
          readonly requires: ReadonlyArray<string>
          /** The keyword the question matched, when it matched a keyword rather than the concept itself. */
          readonly matchedKeyword: string | null
      }
    | { readonly kind: "not-yet"; readonly term: string }

/** The words a learner sees for a term outside the allowed set: it is simply not taught yet, nothing more is said. */
export const NOT_YET = "chưa học tới"

/**
 * Explains a term from the allowed set: a concept by its id, its term or its Vietnamese name, or one of its keywords. Anything else
 * answers `not-yet` and nothing else, not even whether the graph knows the term: saying "that is lesson 14" would name it.
 */
export const explainOf = (allowed: ReadonlyArray<ConceptNode>, term: string): ExplainAnswer => {
    const wanted = normalOf(term)
    const own = allowed.find((node) => [node.id, node.term, node.vi ?? ""].some((word) => normalOf(word) === wanted))
    const viaKeyword =
        own === undefined
            ? allowed
                  .flatMap((node) => node.keywords.map((keyword) => ({ node, keyword })))
                  .find((pair) => normalOf(pair.keyword) === wanted)
            : undefined
    const node = own ?? viaKeyword?.node
    if (node === undefined) return { kind: "not-yet", term }
    const allowedIds = new Set(allowed.map((item) => item.id))
    return {
        kind: "explained",
        id: node.id,
        term: node.term,
        vi: node.vi ?? null,
        oneLine: node.oneLine,
        keywords: node.keywords,
        // A required concept is always in the set (the set is closed under requires); the filter keeps the rule explicit anyway.
        requires: node.requires.filter((id) => allowedIds.has(id)),
        matchedKeyword: viaKeyword?.keyword ?? null,
    }
}
