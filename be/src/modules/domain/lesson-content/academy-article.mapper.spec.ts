import { Test } from "@nestjs/testing"
import { LessonContentError, LessonContentErrorCode } from "./errors/lesson-content.error"
import {
    deriveArticleIndex,
    indexMismatchField,
    interviewGradingOf,
    interviewPromptText,
    publicArticleText,
    section1Text,
} from "./academy-article.mapper"
import { bytesOf, sha256Hex, textOf } from "./academy-document.mapper"
import type { ManifestArticle } from "./academy-manifest.mapper"
import type { InterviewQuestionIndex } from "./lesson-content.contracts"

const SEPARATOR = "<!-- @starci/seperator -->"
const encode = (text: string): Uint8Array => new TextEncoder().encode(text)

const leaf = (name: string, value: string): string => `# ${name}\n${SEPARATOR}\n${value}\n${SEPARATOR}\n`

const body = (article: string): Uint8Array =>
    encode(`${leaf("sortIndex", "0")}${leaf("lang", "typescript")}${leaf("body", article)}`)

const interviewSection = (items: string): string => `## 9. Interview\n${items}`

const question = (n: number): string => `- **Question ${n}?**\n  - points ${n}\n  - answer ${n}\n`

const article = (interview: string = interviewSection(`${question(1)}${question(2)}`)): string =>
    `## 1. Opening\nhello\n## 2. Core\nbody\n${interview}`

const malformed = LessonContentErrorCode.SourceMalformed
const unclassified = LessonContentErrorCode.ClassificationUnknown
const mismatch = LessonContentErrorCode.SourceMismatch

const SUBJECT = Symbol("academy-article")
const helpers = {
    deriveArticleIndex,
    indexMismatchField,
    interviewGradingOf,
    interviewPromptText,
    publicArticleText,
    section1Text,
    bytesOf,
    sha256Hex,
    textOf,
}

/** Builds the subject through the testing module, the way consumers reach it. */
const build = async (): Promise<typeof helpers> =>
    (await Test.createTestingModule({ providers: [{ provide: SUBJECT, useFactory: () => helpers }] }).compile()).get<
        typeof helpers
    >(SUBJECT)

describe("deriveArticleIndex", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    it("derives the article, section-1, outline, protected ranges and interview index", () => {
        const raw = body(article())
        const index = subject.deriveArticleIndex(raw, "typescript")

        expect(index.outline.map((entry) => entry.id)).toEqual(["section-1", "section-2", "section-9"])
        expect(index.interviewQuestions.map((entry) => entry.id)).toEqual(["interview-1", "interview-2"])
        expect(index.protectedRanges).toHaveLength(4)
        expect(subject.textOf(raw, index.section1)).toContain("## 1. Opening")
        expect(subject.textOf(raw, index.section1)).not.toContain("## 2. Core")
        expect(index.publicArticleRanges.length).toBeGreaterThan(0)
        expect(index.protectedRanges.every((range) => range.start < range.end)).toBe(true)
    })

    it("does not treat headings inside fenced code as outline entries", () => {
        const withFence = `## 1. Opening\n\`\`\`ts\n## 99. Fake\n\`\`\`\n## 2. Core\nx\n${interviewSection(question(1))}`

        const index = subject.deriveArticleIndex(body(withFence), "typescript")

        expect(index.outline.map((entry) => entry.id)).toEqual(["section-1", "section-2", "section-9"])
    })

    it("refuses an unnumbered heading", () => {
        const withPlain = `## 1. Opening\n## Loose heading\n## 2. Core\nx\n${interviewSection(question(1))}`

        expect(() => subject.deriveArticleIndex(body(withPlain), "typescript")).toThrow(malformed)
    })

    it("refuses unknown top-level fields", () => {
        const raw = encode(
            `${leaf("sortIndex", "0")}${leaf("lang", "typescript")}${leaf("body", article())}${leaf("extra", "x")}`,
        )

        expect(() => subject.deriveArticleIndex(raw, "typescript")).toThrow(unclassified)
    })

    it("refuses a lang that is not the programming language of the variant", () => {
        expect(() => subject.deriveArticleIndex(body(article()), "java")).toThrow(mismatch)
    })

    it("refuses a body that is not a leaf value", () => {
        const raw = encode(`${leaf("sortIndex", "0")}${leaf("lang", "typescript")}# body\n## sub\n`)

        expect(() => subject.deriveArticleIndex(raw, "typescript")).toThrow(malformed)
    })

    it("refuses an article with no outline and one with a single section", () => {
        expect(() => subject.deriveArticleIndex(body("plain prose\n"), "typescript")).toThrow(malformed)
        expect(() => subject.deriveArticleIndex(body("## 1. Only\nx\n"), "typescript")).toThrow(malformed)
    })

    it("keeps the bytes after the last protected range as a public range", () => {
        const trailing = `## 1. Opening\nx\n${interviewSection(`${question(1)}\n`)}`
        const idx = subject.deriveArticleIndex(body(trailing), "typescript")

        const lastProtectedEnd = Math.max(...idx.protectedRanges.map((range) => range.end))
        expect(
            idx.publicArticleRanges.some((range) => range.start === lastProtectedEnd && range.end === idx.article.end),
        ).toBe(true)
    })
})

describe("deriveArticleIndex interview structure", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })

    it("refuses interview structure it cannot classify", () => {
        const childless = `## 1. Opening\nx\n## 2. Core\ny\n${interviewSection("  - orphan\n")}`
        expect(() => subject.deriveArticleIndex(body(childless), "typescript")).toThrow(unclassified)

        const prose = `## 1. Opening\nx\n## 2. Core\ny\n${interviewSection("not a bullet\n")}`
        expect(() => subject.deriveArticleIndex(body(prose), "typescript")).toThrow(unclassified)

        const oneChild = `## 1. Opening\nx\n## 2. Core\ny\n${interviewSection("- **Q?**\n  - only\n")}`
        expect(() => subject.deriveArticleIndex(body(oneChild), "typescript")).toThrow(unclassified)

        const noChild = `## 1. Opening\nx\n## 2. Core\ny\n${interviewSection("- **Q?**\n- **Q2?**\n  - a\n  - b\n")}`
        expect(() => subject.deriveArticleIndex(body(noChild), "typescript")).toThrow(unclassified)

        const badLine = `## 1. Opening\nx\n## 2. Core\ny\n${interviewSection("- **Q?**\nnot a bullet\n")}`
        expect(() => subject.deriveArticleIndex(body(badLine), "typescript")).toThrow(unclassified)

        const threeChildren = `## 1. Opening\nx\n## 2. Core\ny\n${interviewSection("- **Q?**\n  - a\n  - b\n  - c\n")}`
        expect(() => subject.deriveArticleIndex(body(threeChildren), "typescript")).toThrow(unclassified)
    })
})

/** Derives the index of the standard article and the recorded index to compare it with. */
const mismatchCase = async () => {
    const subject = await build()
    const raw = body(article())
    const index = subject.deriveArticleIndex(raw, "typescript")
    const recorded = (): ManifestArticle => ({
        programmingLanguage: "typescript",
        locale: "en",
        fixturePath: "original/bodies/0-typescript/en.md",
        article: { ...index.article, sha256: "0".repeat(64) },
        section1: { ...index.section1, sha256: "0".repeat(64) },
        outline: index.outline.map((entry) => ({ ...entry })),
        protectedRanges: index.protectedRanges.map((entry) => ({ ...entry })),
        interviewQuestions: index.interviewQuestions.map((entry) => ({
            ...entry,
            protectedRanges: entry.protectedRanges.map((r) => ({ ...r })),
        })),
        publicArticleRanges: index.publicArticleRanges.map((entry) => ({ ...entry })),
    })
    const matching = (): ManifestArticle => {
        const base = recorded()
        return {
            ...base,
            article: { ...base.article, sha256: subject.sha256Hex(subject.bytesOf(raw, index.article)) },
            section1: { ...base.section1, sha256: subject.sha256Hex(subject.bytesOf(raw, index.section1)) },
        }
    }
    const check = (recordedArticle: ManifestArticle): string | null =>
        subject.indexMismatchField(raw, index, recordedArticle)
    return { index, matching, check }
}

describe("indexMismatchField names the fields that differ", () => {
    let c: Awaited<ReturnType<typeof mismatchCase>>
    beforeAll(async () => {
        c = await mismatchCase()
    })
    const check = (recordedArticle: ManifestArticle): string | null => c.check(recordedArticle)

    it("answers null when the derived index equals the recorded one", () => {
        expect(check(c.matching())).toBeNull()
    })

    it("names the article, section1 and outline fields that differ", () => {
        const recordedBadArticle = { ...c.matching(), article: { ...c.index.article, sha256: "f".repeat(64) } }
        expect(check(recordedBadArticle)).toBe("article")

        const recordedBadRange = c.matching()
        expect(
            check({
                ...recordedBadRange,
                article: {
                    start: c.index.article.start + 1,
                    end: c.index.article.end,
                    sha256: recordedBadRange.article.sha256,
                },
            }),
        ).toBe("article")

        expect(check({ ...c.matching(), section1: { ...c.index.section1, sha256: "f".repeat(64) } })).toBe("section1")
        expect(
            check({
                ...c.matching(),
                section1: { start: c.index.section1.start, end: c.index.section1.end - 1, sha256: "f".repeat(64) },
            }),
        ).toBe("section1")

        expect(check({ ...c.matching(), outline: [] })).toBe("outline")
        expect(
            check({
                ...c.matching(),
                outline: [
                    ...c.index.outline.map((entry) => ({ ...entry })),
                    { id: "extra", depth: 2, text: "x", start: 0, end: 1 },
                ],
            }),
        ).toBe("outline")
        expect(
            check({
                ...c.matching(),
                outline: c.index.outline.map((entry, at) => (at === 0 ? { ...entry, text: "changed" } : { ...entry })),
            }),
        ).toBe("outline")
    })
})

describe("indexMismatchField names the range fields that differ", () => {
    let c: Awaited<ReturnType<typeof mismatchCase>>
    beforeAll(async () => {
        c = await mismatchCase()
    })
    const check = (recordedArticle: ManifestArticle): string | null => c.check(recordedArticle)

    it("names the protected, interview and public range fields that differ", () => {
        expect(check({ ...c.matching(), protectedRanges: [] })).toBe("protectedRanges")
        expect(
            check({
                ...c.matching(),
                protectedRanges: [
                    ...c.index.protectedRanges.map((entry) => ({ ...entry })),
                    { start: 0, end: 1, kind: "sampleAnswer" },
                ],
            }),
        ).toBe("protectedRanges")
        expect(check({ ...c.matching(), interviewQuestions: [] })).toBe("interviewQuestions")
        expect(
            check({
                ...c.matching(),
                interviewQuestions: [
                    ...c.index.interviewQuestions.map((entry) => ({
                        ...entry,
                        protectedRanges: entry.protectedRanges.map((r) => ({ ...r })),
                    })),
                    { id: "extra", promptStart: 0, promptEnd: 1, protectedRanges: [] },
                ],
            }),
        ).toBe("interviewQuestions")
        expect(
            check({
                ...c.matching(),
                interviewQuestions: c.index.interviewQuestions.map((entry) => ({ ...entry, id: "other" })),
            }),
        ).toBe("interviewQuestions")

        expect(check({ ...c.matching(), publicArticleRanges: [] })).toBe("publicArticleRanges")
        expect(
            check({
                ...c.matching(),
                publicArticleRanges: c.index.publicArticleRanges.map((entry, at) =>
                    at === 0 ? { start: entry.start + 1, end: entry.end } : { ...entry },
                ),
            }),
        ).toBe("publicArticleRanges")
    })
})

describe("interview grading and prompts", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    const raw = body(article())
    let index: ReturnType<typeof helpers.deriveArticleIndex>
    beforeAll(() => {
        index = subject.deriveArticleIndex(raw, "typescript")
    })

    it("extracts the prompt text without the bullet markers", () => {
        const first = index.interviewQuestions[0]
        if (first === undefined)
            throw new LessonContentError({ code: malformed, params: { reason: "no interview question", line: 0 } })

        expect(subject.interviewPromptText(raw, first)).toBe("Question 1?")
    })

    it("refuses a prompt range that is not a bold bullet", () => {
        const fake: InterviewQuestionIndex = { id: "i", promptStart: 0, promptEnd: 5, protectedRanges: [] }

        expect(() => subject.interviewPromptText(encode("plain\n"), fake)).toThrow(malformed)
    })

    it("extracts the interviewer points and the sample answer of every question", () => {
        const grading = subject.interviewGradingOf(raw, index.interviewQuestions)

        expect(grading).toHaveLength(2)
        expect(grading[0]?.interviewerPoints).toContain("points 1")
        expect(grading[0]?.sampleAnswer).toContain("answer 1")
    })

    it("refuses a question whose protected ranges lost a kind", () => {
        const fake: InterviewQuestionIndex = {
            id: "i",
            promptStart: 0,
            promptEnd: 1,
            protectedRanges: [{ start: 0, end: 1, kind: "interviewerPoints" }],
        }

        expect(() => subject.interviewGradingOf(encode("x"), [fake])).toThrow(unclassified)
    })
})

describe("article projections", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })
    const raw = body(article())
    let index: ReturnType<typeof helpers.deriveArticleIndex>
    beforeAll(() => {
        index = subject.deriveArticleIndex(raw, "typescript")
    })

    it("answers the public text without the protected ranges", () => {
        const text = subject.publicArticleText(raw, index)

        expect(text).toContain("## 1. Opening")
        expect(text).toContain("Question 1?")
        expect(text).not.toContain("points 1")
        expect(text).not.toContain("answer 1")
    })

    it("answers the exact section-1 text", () => {
        const text = subject.section1Text(raw, index)

        expect(text).toContain("## 1. Opening")
        expect(text).not.toContain("## 2. Core")
    })
})
