import type { LessonTopicSource } from "./lesson-topic.contracts"
import type { LessonLocale, LessonDifficulty, LessonSection, LessonRootFile, LessonContent } from "./lesson.contracts"

/** One problem found while importing a lesson, with the source file and field that hold it. */
export interface LessonIssue {
    /** The file of the lesson folder, posix and relative (`sections/2-experiment/vi.md`). */
    readonly path: string
    /** The field inside the file (`activities[0].options[1].isCorrect`), or an empty text for the file itself. */
    readonly field: string
    /** What is wrong, in words for the author. */
    readonly message: string
}

/** One file read from a lesson folder: its text and the hash of its raw bytes. */
export interface LessonSourceFile {
    /** The posix path relative to the lesson folder. */
    readonly path: string
    /** The decoded text. */
    readonly text: string
    /** The lowercase hex SHA-256 of the raw bytes. */
    readonly sha256: string
}

/** A lesson folder read, parsed and validated, ready to store. */
export interface LessonDraft {
    /** The stable id: the folder name without its numeric prefix. */
    readonly id: string
    /** The category. */
    readonly category: string
    /** The catalog group resolved from the lesson map or its category. */
    readonly group: string
    /** The topic slug resolved from the topic map. */
    readonly topic: string
    /** The topic the slug names. */
    readonly topicSource: LessonTopicSource
    /** The V1 content folder the lesson was converted from, or null. */
    readonly sourceKey: string | null
    /** The difficulty. */
    readonly difficulty: LessonDifficulty
    /** The minutes a learner needs. */
    readonly minutesRead: number
    /** The implementation language, or `agnostic`. */
    readonly implementation: string
    /** The position in the catalog. */
    readonly sortIndex: number
    /** The content to store. */
    readonly content: LessonContent
    /** The SHA-256 of every source file by posix path. */
    readonly sourceHashes: Readonly<Record<string, string>>
    /** The SHA-256 over the sorted path and hash lines of every source file. */
    readonly contentHash: string
}

/** The outcome of reading a lesson folder: a draft, or the issues that block it. */
export interface LessonDraftResult {
    /** The draft, when no issue blocks it. */
    readonly draft: LessonDraft | null
    /** Every issue found, in file order. */
    readonly issues: ReadonlyArray<LessonIssue>
}

/** What the import asks of one concepts directory. */
export interface ImportLessonsParams {
    /** The directory that holds the concept folders. */
    readonly directory: string
    /** The label of the source ref (a git sha); it becomes the version of every lesson imported. */
    readonly ref: string
    /** The folder names to import, separated by commas; an empty text imports every folder. */
    readonly only: string
}

/** What happened to one lesson folder; `relinked` is an identical version whose topic path row was repointed. */
export type LessonImportStatus = "created" | "unchanged" | "relinked" | "refused" | "invalid"

/** The counts, version and hashes the import prints for one lesson folder; it never holds an answer. */
export interface LessonImportReport {
    /** The folder name. */
    readonly folder: string
    /** The lesson id. */
    readonly id: string
    /** The version: the source ref. */
    readonly version: string
    /** What happened. */
    readonly status: LessonImportStatus
    /** The content hash of the source, or an empty text when the folder could not be read. */
    readonly contentHash: string
    /** The number of source files read. */
    readonly files: number
    /** The number of sections in one locale. */
    readonly sections: number
    /** The number of activities in one locale. */
    readonly activities: number
    /** The problems that blocked the lesson; empty when it was stored or unchanged. */
    readonly issues: ReadonlyArray<LessonIssue>
}

/** One locale read from the source: its root fields and its sections in learning order. */
export interface LessonParsedLocale {
    /** The decoded root file. */
    readonly root: LessonRootFile
    /** The decoded sections, ordered by their position. */
    readonly sections: ReadonlyArray<LessonSection>
}

/** Both locales of a lesson read from the source. */
export type LessonParsedSource = Readonly<Record<LessonLocale, LessonParsedLocale>>

/** The result of reading a source: both locales, or the issues that block them. */
export interface LessonSourceResult {
    /** The parsed locales, or null when an issue blocks them. */
    readonly parsed: LessonParsedSource | null
    /** Every issue found. */
    readonly issues: ReadonlyArray<LessonIssue>
}
