/** The languages the project kit ships a CI template for, in the order of the kit's `ci/<n>-<language>.yml` files. */
export const KIT_LANGUAGES: ReadonlyArray<string> = ["typescript", "java", "csharp", "go"]

/** What `starci/project.yaml` tells the CLI: the project StarCi knows it by, and how to run its tests. */
export interface KitConfig {
    /** The StarCi project id, or null while the placeholder is still there. */
    readonly projectId: string | null
    /** The test command, or null when the file names none. */
    readonly testCommand: string | null
    /** The JUnit report path the test command writes, or null when the file names none. */
    readonly testReport: string | null
}

const PROJECT_ID = /^[A-Za-z0-9._-]{1,100}$/u

/** True when a text can be a project id (not the `<project-id>` placeholder of the kit). */
export const projectIdValid = (text: string): boolean => PROJECT_ID.test(text)

/** The kit's CI template file for a language, or null when the language is not one. */
export const ciTemplateOf = (language: string): string | null => {
    const index = KIT_LANGUAGES.indexOf(language)
    return index < 0 ? null : `${index}-${language}.yml`
}

/** A scalar value as written in YAML: its trailing comment and surrounding quotes removed, null when empty. */
const scalarOf = (raw: string): string | null => {
    const text = raw.trim()
    const quote = text[0]
    if (quote === '"' || quote === "'") {
        const end = text.indexOf(quote, 1)
        return end < 0 ? null : text.slice(1, end) || null
    }
    const hash = text.search(/\s#/u)
    const bare = (hash < 0 ? text : text.slice(0, hash)).trim()
    return bare === "" ? null : bare
}

/** The value of `key:` at the given indent, searching only the given lines. */
const valueOf = (lines: ReadonlyArray<string>, key: string, indent: string): string | null => {
    const line = lines.find((candidate) => candidate.startsWith(`${indent}${key}:`))
    return line === undefined ? null : scalarOf(line.slice(indent.length + key.length + 1))
}

/** The indented lines that belong to a top-level key (up to the next line that starts at column 0). */
const blockOf = (lines: ReadonlyArray<string>, key: string): ReadonlyArray<string> => {
    const start = lines.findIndex((line) => line.trimEnd() === `${key}:`)
    if (start < 0) return []
    const rest = lines.slice(start + 1)
    const end = rest.findIndex((line) => /^\S/u.test(line))
    return end < 0 ? rest : rest.slice(0, end)
}

/** Reads the three facts the CLI needs from the text of `starci/project.yaml`; nothing else in the file is read. */
export const kitConfigOf = (text: string): KitConfig => {
    const lines = text.split(/\r?\n/u)
    const projectId = valueOf(lines, "project", "")
    const test = blockOf(lines, "test")
    return {
        projectId: projectId !== null && projectIdValid(projectId) ? projectId : null,
        testCommand: valueOf(test, "command", "  "),
        testReport: valueOf(test, "report", "  "),
    }
}

/** The text of `starci/project.yaml` with the project id and language the learner chose written in. */
export const withIdentity = (text: string, projectId: string | null, language: string): string => {
    const withLanguage = text.replace(/^language:.*$/mu, `language: ${language}`)
    return projectId === null ? withLanguage : withLanguage.replace(/^project:.*$/mu, `project: "${projectId}"`)
}

/** The language a project folder is written in, from the names of its top-level files; null when none says. */
export const languageOfFiles = (names: ReadonlyArray<string>): string | null => {
    const has = (test: (name: string) => boolean): boolean => names.some(test)
    if (has((name) => name === "go.mod")) return "go"
    if (has((name) => name === "pom.xml" || name === "build.gradle" || name === "build.gradle.kts")) return "java"
    if (has((name) => name.endsWith(".csproj") || name.endsWith(".sln") || name.endsWith(".slnx"))) return "csharp"
    if (has((name) => name === "package.json" || name === "tsconfig.json")) return "typescript"
    return null
}

/** The ids of a YAML list written inline (`[a, b]`). */
const inlineListOf = (text: string): ReadonlyArray<string> =>
    text
        .replace(/^\s*\[/u, "")
        .replace(/\].*$/u, "")
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")

/** The ids a key lists, written inline or as a block list, starting at the line after `from`. */
const listAfter = (lines: ReadonlyArray<string>, from: number, inline: string): ReadonlyArray<string> => {
    if (inline.includes("[")) return inlineListOf(inline)
    const items: Array<string> = []
    for (const line of lines.slice(from + 1)) {
        const item = /^\s+-\s+(\S+)\s*$/u.exec(line)
        if (item?.[1] === undefined) break
        items.push(item[1])
    }
    return items
}

/** The milestone `init` copies the e2e flows of, with its concepts. */
export interface KitMilestone {
    /** The milestone id. */
    readonly id: string
    /** The concept ids it lists, in order. */
    readonly concepts: ReadonlyArray<string>
}

/**
 * Reads one milestone of the project catalog (`projects/catalog.yaml`): the one named, else the first milestone of the app kind
 * (`kinds.app`), else the first milestone listed. Null when the catalog lists none or not the one named. The catalog is read
 * line by line, only for the ids it holds, in both the block and the inline list spelling.
 */
export const milestoneOfCatalog = (text: string, wanted: string | null): KitMilestone | null => {
    const lines = text.split(/\r?\n/u)
    const block = blockOf(lines, "milestones")
    const starts = block.flatMap((line, index) => (/^\s*-\s+id:/u.test(line) ? [index] : []))
    const entries = starts.map((start, position) => {
        const own = block.slice(start, starts[position + 1] ?? block.length)
        const id = scalarOf((own[0] ?? "").replace(/^\s*-\s+id:/u, ""))
        const at = own.findIndex((line) => /^\s+concepts:/u.test(line))
        const concepts = at < 0 ? [] : listAfter(own, at, (own[at] ?? "").replace(/^\s+concepts:/u, ""))
        return { id: id ?? "", concepts }
    })
    const kinds = blockOf(lines, "kinds")
    const appLine = kinds.findIndex((line) => /^\s+app:/u.test(line))
    const appIds = appLine < 0 ? [] : listAfter(kinds, appLine, (kinds[appLine] ?? "").replace(/^\s+app:/u, ""))
    const id = wanted ?? appIds[0] ?? entries[0]?.id ?? null
    return entries.find((entry) => entry.id === id) ?? null
}

/** Whether a kit file is the e2e flow of a concept outside the milestone, which `init` leaves out. */
export const isOtherConceptFlow = (path: string, concepts: ReadonlySet<string> | null): boolean => {
    if (concepts === null) return false
    const flow = /^starci\/e2e\/(.+)\.md$/u.exec(path)
    return flow?.[1] !== undefined && !concepts.has(flow[1])
}
