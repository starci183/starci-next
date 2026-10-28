import { LessonContentError, LessonContentErrorCode } from "./errors/lesson-content.error"
import {
    bytesOf,
    leafInt,
    leafText,
    parseAcademyDocument,
    requiredChild,
    sha256Hex,
    splitLines,
    textOf,
    unknownNames,
} from "./academy-document.mapper"
import type { DocumentLine } from "./academy-document.mapper"
import type {
    ManifestArticle,
    ManifestInterviewQuestion,
    ManifestOutlineEntry,
    ManifestProtectedRange,
    ManifestRange,
} from "./academy-manifest.mapper"
import type {
    ArticleIndex,
    ByteRange,
    InterviewGrading,
    InterviewQuestionIndex,
    OutlineEntry,
    ProtectedRange,
    ProgrammingLanguage,
} from "./lesson-content.contracts"

const BODY_FIELDS = ["sortIndex", "lang", "body"]
const NUMBERED_HEADING = /^(#{1,6})\s+((?:\d+\.)+)\s+(\S.*)$/
const ANY_HEADING = /^#{1,6}\s/
const QUESTION_BULLET = /^- \*\*(.+)\*\*\s*$/
const CHILD_BULLET = /^ {2}- /
const CODE_FENCE = /^```/

const malformed = (reason: string, at: number): LessonContentError =>
    new LessonContentError({ code: LessonContentErrorCode.SourceMalformed, params: { reason, line: at } })

const unclassified = (reason: string): LessonContentError =>
    new LessonContentError({ code: LessonContentErrorCode.ClassificationUnknown, params: { reason } })

/** The headings of the article: numbered Markdown headings outside code fences, with their line ranges. */
const outlineOf = (lines: ReadonlyArray<DocumentLine>, article: ByteRange): Array<OutlineEntry> => {
    const outline: Array<OutlineEntry> = []
    let fenced = false
    for (const line of lines) {
        if (line.start < article.start || line.start >= article.end) continue
        if (CODE_FENCE.test(line.text.trimStart())) {
            fenced = !fenced
            continue
        }
        if (fenced) continue
        const match = NUMBERED_HEADING.exec(line.text)
        if (match === null) {
            if (ANY_HEADING.test(line.text)) throw malformed("a heading has no numeric prefix", line.start)
            continue
        }
        outline.push({
            id: `section-${String(match[2]).slice(0, -1)}`,
            depth: String(match[1]).length,
            text: line.text.slice(String(match[1]).length).trimStart(),
            start: line.start,
            end: line.end,
        })
    }
    return outline
}

/** The section-1 range: from the article start to the second top-level heading. */
const section1Of = (article: ByteRange, outline: ReadonlyArray<OutlineEntry>): ByteRange => {
    const topLevel = outline.filter((entry) => entry.depth === 2)
    const second = topLevel[1]
    if (second === undefined) throw malformed("the article has no second section", article.start)
    return { start: article.start, end: second.start }
}

/**
 * The interview items of the last article section: one bold question bullet followed by exactly two indented child
 * bullets (the interviewer points and the sample answer). Any other line in the section fails closed.
 */
const interviewQuestionsOf = (
    lines: ReadonlyArray<DocumentLine>,
    last: OutlineEntry,
    article: ByteRange,
): ReadonlyArray<InterviewQuestionIndex> => {
    const prompts: Array<{ readonly promptStart: number; readonly children: Array<ByteRange> }> = []
    for (const line of lines) {
        if (line.start < last.end || line.start >= article.end) continue
        if (line.text.trim() === "") continue
        if (QUESTION_BULLET.test(line.text)) {
            prompts.push({ promptStart: line.start, children: [] })
            continue
        }
        const current = prompts[prompts.length - 1]
        if (current === undefined) throw unclassified("an interview line has no question")
        if (!CHILD_BULLET.test(line.text)) throw unclassified(`an unclassified interview line at byte ${line.start}`)
        current.children.push({ start: line.start, end: line.end })
    }
    const questions: Array<InterviewQuestionIndex> = []
    for (const prompt of prompts) {
        const [firstChild, secondChild] = prompt.children
        if (firstChild === undefined || secondChild === undefined || prompt.children.length !== 2) {
            throw unclassified(`an interview question has ${prompt.children.length} children`)
        }
        questions.push({
            id: `interview-${questions.length + 1}`,
            promptStart: prompt.promptStart,
            promptEnd: firstChild.start,
            protectedRanges: [
                { start: firstChild.start, end: firstChild.end, kind: "interviewerPoints" },
                { start: secondChild.start, end: secondChild.end, kind: "sampleAnswer" },
            ],
        })
    }
    return questions
}

/** The public article ranges: the article minus its protected ranges, in source order. */
const publicRangesOf = (article: ByteRange, protectedRanges: ReadonlyArray<ProtectedRange>): Array<ByteRange> => {
    const ranges: Array<ByteRange> = []
    let cursor = article.start
    for (const range of protectedRanges) {
        if (range.start > cursor) ranges.push({ start: cursor, end: range.start })
        cursor = range.end
    }
    if (article.end > cursor) ranges.push({ start: cursor, end: article.end })
    return ranges
}

/**
 * Derives the byte index of one Academy body file: the wrapper leaves prove the language, the body value is the
 * article, its numbered headings outside fences the outline, and the trailing section the interview list.
 */
export const deriveArticleIndex = (raw: Uint8Array, programmingLanguage: ProgrammingLanguage): ArticleIndex => {
    const roots = parseAcademyDocument(raw)
    const unknown = unknownNames(roots, BODY_FIELDS)
    if (unknown.length > 0) throw unclassified(`unknown body fields: ${unknown.join(",")}`)
    leafInt(raw, roots, "sortIndex")
    const lang = leafText(raw, roots, "lang")
    if (lang !== programmingLanguage) {
        throw new LessonContentError({
            code: LessonContentErrorCode.SourceMismatch,
            params: { field: "lang", expected: programmingLanguage, actual: lang },
        })
    }
    const body = requiredChild(roots, "body")
    if (body.value === null) throw malformed("the body has no value", 0)
    const article = body.value
    const lines = splitLines(raw)
    const outline = outlineOf(lines, article)
    const last = outline[outline.length - 1]
    if (last === undefined) throw malformed("the article has no outline", article.start)
    const section1 = section1Of(article, outline)
    const interviewQuestions = interviewQuestionsOf(lines, last, article)
    const protectedRanges = interviewQuestions.flatMap((question) => question.protectedRanges)
    return {
        article,
        section1,
        outline,
        protectedRanges,
        interviewQuestions,
        publicArticleRanges: publicRangesOf(article, protectedRanges),
    }
}

const sameRange = (left: ByteRange, right: ManifestRange): boolean =>
    left.start === right.start && left.end === right.end

const sameOutline = (derived: ReadonlyArray<OutlineEntry>, recorded: ReadonlyArray<ManifestOutlineEntry>): boolean => {
    const [entry, ...restDerived] = derived
    const [recordedEntry, ...restRecorded] = recorded
    if (entry === undefined || recordedEntry === undefined) return entry === undefined && recordedEntry === undefined
    return (
        entry.id === recordedEntry.id &&
        entry.depth === recordedEntry.depth &&
        entry.text === recordedEntry.text &&
        entry.start === recordedEntry.start &&
        entry.end === recordedEntry.end &&
        sameOutline(restDerived, restRecorded)
    )
}

const sameProtected = (
    derived: ReadonlyArray<ProtectedRange>,
    recorded: ReadonlyArray<ManifestProtectedRange>,
): boolean => {
    const [range, ...restDerived] = derived
    const [recordedRange, ...restRecorded] = recorded
    if (range === undefined || recordedRange === undefined) return range === undefined && recordedRange === undefined
    return (
        range.start === recordedRange.start &&
        range.end === recordedRange.end &&
        range.kind === recordedRange.kind &&
        sameProtected(restDerived, restRecorded)
    )
}

const sameQuestions = (
    derived: ReadonlyArray<InterviewQuestionIndex>,
    recorded: ReadonlyArray<ManifestInterviewQuestion>,
): boolean => {
    const [question, ...restDerived] = derived
    const [recordedQuestion, ...restRecorded] = recorded
    if (question === undefined || recordedQuestion === undefined)
        return question === undefined && recordedQuestion === undefined
    return (
        question.id === recordedQuestion.id &&
        question.promptStart === recordedQuestion.promptStart &&
        question.promptEnd === recordedQuestion.promptEnd &&
        sameProtected(question.protectedRanges, recordedQuestion.protectedRanges) &&
        sameQuestions(restDerived, restRecorded)
    )
}

/**
 * Compares the index the importer derived with the index the manifest records, answering the first field that
 * differs, or null when they agree exactly (ranges, hashes, outline and classifications alike).
 */
export const indexMismatchField = (raw: Uint8Array, index: ArticleIndex, recorded: ManifestArticle): string | null => {
    if (!sameRange(index.article, recorded.article)) return "article"
    if (sha256Hex(bytesOf(raw, index.article)) !== recorded.article.sha256) return "article"
    if (!sameRange(index.section1, recorded.section1)) return "section1"
    if (sha256Hex(bytesOf(raw, index.section1)) !== recorded.section1.sha256) return "section1"
    if (!sameOutline(index.outline, recorded.outline)) return "outline"
    if (!sameProtected(index.protectedRanges, recorded.protectedRanges)) return "protectedRanges"
    if (!sameQuestions(index.interviewQuestions, recorded.interviewQuestions)) return "interviewQuestions"
    if (
        index.publicArticleRanges.length !== recorded.publicArticleRanges.length ||
        !index.publicArticleRanges.every((range, at) => {
            const entry = recorded.publicArticleRanges[at]
            return entry !== undefined && sameRange(range, entry)
        })
    ) {
        return "publicArticleRanges"
    }
    return null
}

/** The public prompt text of one interview question: the bullet text without its `- **` markers. */
export const interviewPromptText = (raw: Uint8Array, question: InterviewQuestionIndex): string => {
    const line = textOf(raw, { start: question.promptStart, end: question.promptEnd }).trim()
    const match = QUESTION_BULLET.exec(line)
    if (match === null) throw malformed("an interview prompt is not a bold bullet", question.promptStart)
    return String(match[1])
}

/** The server-only grading text of one variant: the points and sample answer of every interview question. */
export const interviewGradingOf = (
    raw: Uint8Array,
    questions: ReadonlyArray<InterviewQuestionIndex>,
): Array<InterviewGrading> =>
    questions.map((question) => {
        const points = question.protectedRanges.find((range) => range.kind === "interviewerPoints")
        const answer = question.protectedRanges.find((range) => range.kind === "sampleAnswer")
        if (points === undefined || answer === undefined)
            throw unclassified("an interview question lacks its protected ranges")
        return { itemId: question.id, interviewerPoints: textOf(raw, points), sampleAnswer: textOf(raw, answer) }
    })

/** The public article text of one variant: its public ranges concatenated in source order. */
export const publicArticleText = (raw: Uint8Array, index: ArticleIndex): string =>
    index.publicArticleRanges.map((range) => textOf(raw, range)).join("")

/** The locked preview text of one variant: the exact section-1 range, nothing more. */
export const section1Text = (raw: Uint8Array, index: ArticleIndex): string => textOf(raw, index.section1)
