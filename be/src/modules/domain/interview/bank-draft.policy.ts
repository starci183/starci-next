import { createHash } from "node:crypto"
import { choiceOf, integerOf, readerOf, textListOf, textOf } from "./field-read.policy"
import type {
    BankDraft,
    BankDraftResult,
    InterviewFamily,
    InterviewIssue,
    InterviewSourceBank,
    InterviewSourceFile,
    QuestionDraft,
} from "./interview.contracts"
import { questionDraftOf } from "./question-draft.policy"

const QUESTION_FILE = /^questions\/([^/]+)\/(.+)$/u

/** The SHA-256 over the sorted path and hash lines of every source file of a bank. */
export const contentHashOf = (files: ReadonlyArray<InterviewSourceFile>): string =>
    createHash("sha256")
        .update(
            [...files]
                .sort((a, b) => a.path.localeCompare(b.path))
                .map((file) => `${file.path}\t${file.sha256}`)
                .join("\n"),
        )
        .digest("hex")

/** The number a question folder starts with. */
const folderNumberOf = (name: string): number => Number.parseInt(name, 10)

/** The question folders of a bank and their files, ordered by the number in the folder name. */
const questionFoldersOf = (files: ReadonlyArray<InterviewSourceFile>): ReadonlyArray<[string, Map<string, string>]> => {
    const folders = new Map<string, Map<string, string>>()
    files.forEach((file) => {
        const match = QUESTION_FILE.exec(file.path)
        if (match === null) return
        const [, folder = "", rest = ""] = match
        const held = folders.get(folder) ?? new Map<string, string>()
        held.set(rest, file.text)
        folders.set(folder, held)
    })
    return [...folders.entries()].sort(([a], [b]) => folderNumberOf(a) - folderNumberOf(b))
}

/**
 * Reads a bank folder into a draft: the bank meta of both locales, then every question. The whole folder is checked and every issue
 * is returned with its source path and field; a bank with any issue has no draft and never touches the version that is live.
 */
export const buildBankDraft = (
    bank: InterviewSourceBank,
    files: ReadonlyArray<InterviewSourceFile>,
): BankDraftResult => {
    const issues: Array<InterviewIssue> = []
    const text = (name: string): string => files.find((file) => file.path === name)?.text ?? ""
    const vi = readerOf("vi.md", text("vi.md"), issues)
    const en = readerOf("en.md", text("en.md"), issues)
    const family = choiceOf<InterviewFamily>(vi, "family", ["technical", "behavioral"])
    const expected: InterviewFamily = bank.course === null ? "behavioral" : "technical"
    if (family !== expected)
        issues.push({ path: "vi.md", field: "family", message: `a bank of ${bank.bankId} is ${expected}` })
    const sortIndex = integerOf(vi, "sortIndex")
    const difficulty = choiceOf(vi, "difficulty", ["easy", "medium", "hard", "insane"])
    const moduleRefs = expected === "technical" ? textListOf(vi, "moduleRefs") : []
    if (expected === "technical" && moduleRefs.length === 0) {
        issues.push({ path: "vi.md", field: "moduleRefs", message: "a technical bank needs at least one module" })
    }
    const titles = { vi: textOf(vi, "title"), en: textOf(en, "title") }
    const descriptions = { vi: textOf(vi, "description"), en: textOf(en, "description") }
    const outcomes = questionFoldersOf(files).map(([folder, texts]) =>
        questionDraftOf(bank.bankId, folder, expected, texts, issues),
    )
    const questions: ReadonlyArray<QuestionDraft> = outcomes.flatMap((outcome) =>
        outcome.kind === "draft" ? [outcome.draft] : [],
    )
    const skipped = outcomes.filter((outcome) => outcome.kind === "skipped").length
    if (questions.length === 0 && issues.length === 0) {
        issues.push({ path: "questions", field: "", message: "the bank holds no question the text interview can take" })
    }
    if (issues.length > 0) return { draft: null, issues }
    const draft: BankDraft = {
        bankId: bank.bankId,
        course: bank.course,
        family: expected,
        sortIndex,
        difficulty,
        titles,
        descriptions,
        moduleRefs,
        questions,
        skipped,
        contentHash: contentHashOf(files),
    }
    return { draft, issues }
}
