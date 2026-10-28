import { cp, readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"

/** The committed, read-only Academy snapshot every lesson-content spec imports. */
export const ACADEMY_FIXTURE_DIR = resolve(
    __dirname,
    "../../../../../.starciwork/_resources/fixtures/lessons/academy-rest-semantics-v1",
)

export const CONTENT_ID = "academy-rest-semantics"
export const VERSION = "1.0.0"
export const LANGUAGES = ["typescript", "java", "csharp", "go"] as const
export const LOCALES = ["en", "vi"] as const
export const CHALLENGE_IDS = [
    "0-restful-api-crud-best-practices-easy",
    "1-pagination-filtering-rest-api-medium",
    "2-batch-operations-with-transaction-hard",
    "3-idempotent-csv-import-insane",
] as const

export type Language = (typeof LANGUAGES)[number]
export type Locale = (typeof LOCALES)[number]

interface Range {
    readonly start: number
    readonly end: number
}

export interface ManifestArticle {
    readonly programmingLanguage: Language
    readonly locale: Locale
    readonly fixturePath: string
    readonly article: Range
    readonly section1: Range
    readonly outline: ReadonlyArray<Range & { readonly id: string; readonly depth: number; readonly text: string }>
    readonly protectedRanges: ReadonlyArray<Range & { readonly kind: string }>
    readonly interviewQuestions: ReadonlyArray<{
        readonly id: string
        readonly promptStart: number
        readonly promptEnd: number
        readonly protectedRanges: ReadonlyArray<Range & { readonly kind: string }>
    }>
    readonly publicArticleRanges: ReadonlyArray<Range>
}

export interface Manifest {
    readonly articles: ReadonlyArray<ManifestArticle>
    readonly files: ReadonlyArray<{ readonly fixturePath: string; readonly bytes: number; readonly sha256: string }>
}

/** The manifest of the committed snapshot, parsed. */
export const readManifest = async (): Promise<Manifest> =>
    JSON.parse(await readFile(join(ACADEMY_FIXTURE_DIR, "manifest.json"), "utf8")) as Manifest

/** The recorded article of one language and locale. */
export const articleOf = (manifest: Manifest, language: Language, locale: Locale): ManifestArticle => {
    const article = manifest.articles.find((entry) => entry.programmingLanguage === language && entry.locale === locale)
    if (article === undefined) throw new Error(`no recorded article ${language}/${locale}`)
    return article
}

/** The UTF-8 text of one byte range of a fixture file, end exclusive. */
export const sliceOf = async (fixturePath: string, range: Range): Promise<string> =>
    (await readFile(join(ACADEMY_FIXTURE_DIR, fixturePath))).subarray(range.start, range.end).toString("utf8")

/** The text a public reader sees for a variant: its public article ranges concatenated in source order. */
export const publicArticleOf = async (article: ManifestArticle): Promise<string> =>
    (await Promise.all(article.publicArticleRanges.map((range) => sliceOf(article.fixturePath, range)))).join("")

/** Copies the snapshot to `target` and flips one byte of the named file, leaving the manifest untouched. */
export const tamperedCopy = async (target: string, fixturePath: string): Promise<string> => {
    await cp(ACADEMY_FIXTURE_DIR, target, { recursive: true })
    const file = join(target, fixturePath)
    const bytes = await readFile(file)
    bytes[bytes.length - 1] = (bytes[bytes.length - 1] ?? 0) ^ 0x01
    await writeFile(file, bytes)
    return target
}

/** Copies the snapshot to `target` with a manifest of other bytes but the same version and valid file hashes. */
export const reissuedCopy = async (target: string): Promise<string> => {
    await cp(ACADEMY_FIXTURE_DIR, target, { recursive: true })
    const file = join(target, "manifest.json")
    const manifest = JSON.parse(await readFile(file, "utf8")) as Record<string, unknown>
    await writeFile(file, JSON.stringify({ ...manifest, capturedAt: "2099-01-01T00:00:00.000Z" }))
    return target
}
