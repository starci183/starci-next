import type {
    LessonSourceTree,
    LessonSourceTreeInvariant,
    LessonSourceTreeScenario,
} from "./lesson-source-tree.contracts"

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

const listOf = (value: unknown): ReadonlyArray<unknown> =>
    Array.isArray(value) ? (value as ReadonlyArray<unknown>) : []

const textOf = (value: unknown): string | null => (typeof value === "string" && value.length > 0 ? value : null)

const scenarioOf = (value: unknown): LessonSourceTreeScenario | null => {
    if (!isRecord(value)) return null
    const id = textOf(value.id)
    const title = textOf(value.title)
    const fault = textOf(value.fault)
    const invariant = textOf(value.invariant)
    if (id === null || title === null || fault === null || invariant === null) return null
    const guards = listOf(value.guards).flatMap((guard) => (isRecord(guard) ? (textOf(guard.name) ?? []) : []))
    return { id, title, fault, invariant, guards }
}

/**
 * The readable source of a stored lesson version, projected field by field from its content: `sourceCode` (the files of
 * `source/`), and the scenarios, invariants and code walk of the Vietnamese `essential` document. Only the fields named here
 * are copied, so a challenge, a hidden scenario, a rubric, an expected output or a hint in the same document can never reach a
 * reader. The version is the content commit; null when it is not one or the version ships no `source/`.
 */
export const lessonSourceTreeOf = (version: string, content: unknown): LessonSourceTree | null => {
    if (!isRecord(content) || !/^[0-9a-f]{7,64}$/u.test(version)) return null
    const files = listOf(content.sourceCode).flatMap((file) => {
        if (!isRecord(file)) return []
        const path = textOf(file.path)
        return path === null || typeof file.content !== "string" ? [] : [{ path, text: file.content }]
    })
    if (files.length === 0) return null
    const locales = isRecord(content.locales) ? content.locales : {}
    const vi = isRecord(locales.vi) ? locales.vi : {}
    const essential = isRecord(vi.essential) ? vi.essential : {}
    const walk = new Map<string, string>()
    for (const entry of listOf(essential.codeWalk)) {
        if (!isRecord(entry)) continue
        const invariant = textOf(entry.invariant)
        const file = textOf(entry.file)
        if (invariant !== null && file !== null && !walk.has(invariant))
            walk.set(invariant, typeof entry.line === "number" ? `${file}:${entry.line}` : file)
    }
    const invariants = listOf(essential.invariants).flatMap((item): Array<LessonSourceTreeInvariant> => {
        if (!isRecord(item)) return []
        const id = textOf(item.id)
        const text = textOf(item.text)
        return id === null || text === null ? [] : [{ id, text, where: walk.get(id) ?? null }]
    })
    return {
        commit: version,
        files: files.sort((a, b) => a.path.localeCompare(b.path)),
        scenarios: listOf(essential.scenarios).flatMap((item) => scenarioOf(item) ?? []),
        invariants,
    }
}
