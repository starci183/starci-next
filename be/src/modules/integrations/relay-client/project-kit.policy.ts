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
