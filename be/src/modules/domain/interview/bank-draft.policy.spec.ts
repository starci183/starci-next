import { Test } from "@nestjs/testing"
import {
    BANK_TITLE_VI,
    BOTTOM_LINE_VI,
    CACHE_IDEAL_VI,
    COPIED_PROMPT_VI,
    HINTED_PROMPT_VI,
    HINTED_STEM_VI,
    LAYER_QUESTION_VI,
} from "@tests/fixtures/i18n/interview-spec.messages"
import {
    bankMetaOf,
    behavioralFilesOf,
    bodyOf,
    fieldOf,
    sourceOf,
    technicalFilesOf,
    technicalQuestionOf,
} from "@tests/fixtures/builders/interview.builder"
import { buildBankDraft, contentHashOf } from "./bank-draft.policy"
import type { InterviewSourceBank, InterviewSourceFile } from "./interview.contracts"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { buildBankDraft, contentHashOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("interview.bank-draft.policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const TECHNICAL: InterviewSourceBank = {
    bankId: "0-fullstack-mastery/0-framework-foundation",
    course: "0-fullstack-mastery",
    folder: "0-framework-foundation",
}
const BEHAVIORAL: InterviewSourceBank = { bankId: "eq/1-behavioral", course: null, folder: "1-behavioral" }

const replace = (
    files: ReadonlyArray<InterviewSourceFile>,
    path: string,
    text: string,
): ReadonlyArray<InterviewSourceFile> => files.map((file) => (file.path === path ? { ...file, text } : file))

const fieldsOf = (result: ReturnType<typeof buildBankDraft>): ReadonlyArray<string> =>
    result.issues.map((issue) => `${issue.path}#${issue.field}`)

describe("buildBankDraft technical", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("reads a valid bank: the meta, the question, its bodies and the grading data apart", () => {
        const { draft, issues } = subject.buildBankDraft(
            TECHNICAL,
            technicalFilesOf({ diagram: "```mermaid\nA-->B\n```" }),
        )

        expect(issues).toEqual([])
        expect(draft).toMatchObject({
            bankId: TECHNICAL.bankId,
            family: "technical",
            moduleRefs: ["0-core"],
            skipped: 0,
            titles: { vi: BANK_TITLE_VI, en: "Bank" },
        })
        const question = draft?.questions[0]
        expect(question).toMatchObject({
            questionId: `${TECHNICAL.bankId}/0`,
            tier: "junior",
            isPremium: false,
            kind: "theory",
        })
        expect(question?.bodies["agnostic"]?.vi.prompt).toBe(LAYER_QUESTION_VI)
        expect(question?.bodies["agnostic"]?.en.diagram).toContain("mermaid")
        expect(question?.grading.locales.en.checklist.map((item) => item.scoreBand)).toEqual([60, 40])
        expect(question?.grading.locales.en.exampleResults).toHaveLength(5)
        expect(question?.grading.ideal["agnostic"]?.en).toContain("service")
        expect(question?.interviewer.en.hints).toHaveLength(2)
        expect(draft?.contentHash).toBe(subject.contentHashOf(technicalFilesOf({ diagram: "```mermaid\nA-->B\n```" })))
    })

    it("skips the kinds the text interview cannot take and says so", () => {
        const files = [
            ...technicalFilesOf(),
            ...technicalFilesOf({ kind: "design" })
                .filter((file) => file.path.startsWith("questions"))
                .map((file) => ({ ...file, path: file.path.replace("0-question", "1-question") })),
        ]

        const { draft } = subject.buildBankDraft(TECHNICAL, files)

        expect(draft?.questions).toHaveLength(1)
        expect(draft?.skipped).toBe(1)
    })

    it("orders questions by the number of their folder", () => {
        const second = technicalFilesOf({ sortIndex: "1" })
            .filter((file) => file.path.startsWith("questions"))
            .map((file) => ({ ...file, path: file.path.replace("0-question", "10-question") }))
        const first = technicalFilesOf()
            .filter((file) => file.path.startsWith("questions"))
            .map((file) => ({ ...file, path: file.path.replace("0-question", "2-question") }))

        const { draft } = subject.buildBankDraft(TECHNICAL, [...technicalFilesOf().slice(0, 2), ...second, ...first])

        expect(draft?.questions.map((question) => question.questionId.split("/").at(-1))).toEqual(["2", "10"])
    })
})

describe("buildBankDraft technical (continued)", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("names every issue with its file and field, and gives no draft", () => {
        let files = technicalFilesOf({
            checklist: JSON.stringify([{ text: "", dimension: "bad", critical: "maybe", scoreBand: "x" }]),
            exampleResults: "not json",
        })
        files = replace(files, "vi.md", bankMetaOf(BANK_TITLE_VI, "behavioral", false))
        const result = subject.buildBankDraft(TECHNICAL, files)

        expect(result.draft).toBeNull()
        expect(fieldsOf(result)).toEqual(
            expect.arrayContaining([
                "vi.md#family",
                "vi.md#moduleRefs",
                "questions/0-question/vi.md#checklist[0].dimension",
                "questions/0-question/vi.md#checklist[0].critical",
                "questions/0-question/vi.md#checklist[0].scoreBand",
                "questions/0-question/vi.md#checklist[0].text",
                "questions/0-question/vi.md#exampleResults",
            ]),
        )
    })

    it.each([
        [
            "score bands that do not sum to 100",
            { checklist: JSON.stringify([{ text: "a", dimension: "technical", critical: "true", scoreBand: "50" }]) },
            "checklist",
        ],
        ["no checklist items", { checklist: "[]" }, "checklist"],
        ["sample answers of the wrong shape", { exampleResults: '[{"level":1}]' }, "exampleResults"],
        ["sample answers that are not a list", { exampleResults: '{"level":1}' }, "exampleResults"],
        [
            "a sample score that is not a number",
            { exampleResults: '[{"level":1,"answer":"a","sonnet":"x","haiku":1}]' },
            "exampleResults",
        ],
        [
            "a sample with no answer",
            { exampleResults: '[{"level":1,"answer":" ","sonnet":1,"haiku":1}]' },
            "exampleResults",
        ],
        ["a sample that is not an object", { exampleResults: "[1]" }, "exampleResults"],
        ["a field that is empty", { tier: "expert" }, "tier"],
        ["a flag that is not a boolean", { isPremium: "yes" }, "isPremium"],
        ["a position that is not a number", { sortIndex: "first" }, "sortIndex"],
    ])("refuses %s", (_case, question, field) => {
        const result = subject.buildBankDraft(TECHNICAL, technicalFilesOf(question))

        expect(result.draft).toBeNull()
        expect(result.issues.map((issue) => issue.field)).toContain(field)
    })
})

describe("buildBankDraft technical (continued) (continued)", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("refuses a question that differs between vi and en, a body with no folder, a bank with no question and a family clash", () => {
        let files = replace(technicalFilesOf(), "questions/0-question/en.md", technicalQuestionOf({ tier: "senior" }))
        files = files.filter((file) => !file.path.includes("bodies/0-agnostic/en.md"))
        const diff = subject.buildBankDraft(TECHNICAL, files)
        const noBody = subject.buildBankDraft(
            TECHNICAL,
            technicalFilesOf().filter((file) => !file.path.includes("bodies")),
        )
        const empty = subject.buildBankDraft(TECHNICAL, technicalFilesOf().slice(0, 2))
        const clash = subject.buildBankDraft(
            TECHNICAL,
            replace(
                technicalFilesOf(),
                "questions/0-question/vi.md",
                technicalQuestionOf().replace(
                    "# family\n<!-- @starci/seperator -->\ntechnical",
                    "# family\n<!-- @starci/seperator -->\nbehavioral",
                ),
            ),
        )

        expect(diff.issues.map((issue) => issue.field)).toEqual(expect.arrayContaining(["meta", "prompt", "lang"]))
        expect(noBody.issues.map((issue) => issue.path)).toContain("questions/0-question/bodies")
        expect(empty.issues.map((issue) => issue.path)).toContain("questions")
        expect(clash.issues.map((issue) => issue.field)).toContain("family")
    })

    it("compares every part of two locales", () => {
        const base = technicalQuestionOf()
        const variants = [
            technicalQuestionOf({ diagram: "d" }),
            base.replace(
                "Why that layer?",
                "Why that layer?\n<!-- @starci/seperator -->\n## 1\n<!-- @starci/seperator -->\nextra",
            ),
            technicalQuestionOf({
                checklist: JSON.stringify([{ text: "a", dimension: "testing", critical: "false", scoreBand: "100" }]),
            }),
            technicalQuestionOf({ exampleResults: '[{"level":9,"answer":"a","sonnet":1,"haiku":1}]' }),
        ]
        variants.forEach((variant) => {
            const result = subject.buildBankDraft(
                TECHNICAL,
                replace(technicalFilesOf(), "questions/0-question/en.md", variant),
            )

            expect(result.draft).toBeNull()
        })
        const noBodyDiff = replace(
            technicalFilesOf(),
            "questions/0-question/bodies/0-agnostic/en.md",
            bodyOf("typescript"),
        )
        expect(subject.buildBankDraft(TECHNICAL, noBodyDiff).issues.map((issue) => issue.field)).toContain("lang")
    })
})

describe("buildBankDraft behavioral", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("reads a valid behavioural bank: the six STAR lines and the ownership signal", () => {
        const { draft, issues } = subject.buildBankDraft(BEHAVIORAL, behavioralFilesOf({ leadershipTier: "people" }))

        expect(issues).toEqual([])
        expect(draft).toMatchObject({ family: "behavioral", moduleRefs: [] })
        const question = draft?.questions[0]
        expect(question).toMatchObject({ competency: "conflict", leadershipTier: "people", kind: "behavioral" })
        expect(question?.grading.locales.vi.star.map((line) => line.key)).toHaveLength(6)
        expect(question?.grading.locales.vi.ownershipSignal).toContain("we-only")
        expect(question?.bodies["agnostic"]?.vi.prompt).toBe("Tell me about a disagreement.")
    })

    it("refuses a rubric without the six dimensions, a line with no prefix and a different competency", () => {
        const fewer = subject.buildBankDraft(
            BEHAVIORAL,
            behavioralFilesOf({ rubric: JSON.stringify(["[situationClarity] a", "no prefix at all"]) }),
        )
        const other = replace(behavioralFilesOf(), "questions/0-question/en.md", fieldOf("competency", "growth"))

        expect(fewer.draft).toBeNull()
        expect(fewer.issues.map((issue) => issue.field)).toEqual(expect.arrayContaining(["rubric", "rubric[1]"]))
        expect(subject.buildBankDraft(BEHAVIORAL, other).draft).toBeNull()
    })

    it("refuses a technical bank folder that holds behavioural files and the reverse", () => {
        expect(subject.buildBankDraft(TECHNICAL, behavioralFilesOf()).draft).toBeNull()
        expect(subject.buildBankDraft(BEHAVIORAL, technicalFilesOf()).draft).toBeNull()
        expect(subject.buildBankDraft(BEHAVIORAL, [sourceOf("vi.md", ""), sourceOf("en.md", "")]).draft).toBeNull()
    })
})

describe("buildBankDraft with files that are missing or oddly shaped", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("reports every file of an empty bank folder instead of throwing", () => {
        const result = subject.buildBankDraft(TECHNICAL, [])

        expect(result.draft).toBeNull()
        expect(fieldsOf(result)).toEqual(expect.arrayContaining(["vi.md#title", "en.md#title", "vi.md#family"]))
    })

    it("reports a question folder without its locale files and gives it the number 0 when its name has none", () => {
        const files = [
            ...technicalFilesOf().slice(0, 2),
            sourceOf("questions/weird/bodies/0-agnostic/vi.md", bodyOf("agnostic")),
        ]

        const result = subject.buildBankDraft(TECHNICAL, files)

        expect(result.issues.map((issue) => issue.path)).toEqual(
            expect.arrayContaining(["questions/weird/vi.md", "questions/weird/en.md"]),
        )
    })

    it("names a number-less folder question 0", () => {
        const files = technicalFilesOf().map((file) => ({ ...file, path: file.path.replace("0-question", "first") }))

        expect(subject.buildBankDraft(TECHNICAL, files).draft?.questions[0]?.questionId).toBe(`${TECHNICAL.bankId}/0`)
    })

    it("refuses items of the wrong kind in a list and checklist items with missing sub-fields", () => {
        const objectTags = technicalQuestionOf().replace(
            /# tags[\s\S]*?(?=# rubric)/u,
            "# tags\n## 0\n### a\n<!-- @starci/seperator -->\nb\n<!-- @starci/seperator -->\n",
        )
        const textChecklist = technicalQuestionOf().replace(
            /# checklist[\s\S]*?(?=# exampleResults)/u,
            "# checklist\n## 0\n<!-- @starci/seperator -->\nplain\n<!-- @starci/seperator -->\n",
        )
        const bare = technicalQuestionOf({ checklist: JSON.stringify([{ dimension: "technical", critical: "true" }]) })

        const fields = [objectTags, textChecklist, bare].flatMap((text) =>
            subject
                .buildBankDraft(TECHNICAL, replace(technicalFilesOf(), "questions/0-question/vi.md", text))
                .issues.map((issue) => issue.field),
        )

        expect(fields).toEqual(
            expect.arrayContaining(["tags[0]", "checklist[0]", "checklist[0].scoreBand", "checklist[0].text"]),
        )
    })
})

describe("buildBankDraft with a missing number", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("reports a missing sortIndex once, not twice", () => {
        const text = technicalQuestionOf().replace(
            /# sortIndex\n<!-- @starci\/seperator -->\n0\n<!-- @starci\/seperator -->\n/u,
            "",
        )

        const result = subject.buildBankDraft(
            TECHNICAL,
            replace(technicalFilesOf(), "questions/0-question/vi.md", text),
        )

        expect(result.issues.filter((issue) => issue.field === "sortIndex")).toHaveLength(1)
    })
})

describe("buildBankDraft behavioral files that are missing", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    it("reports a behavioural question without its locale files", () => {
        const result = subject.buildBankDraft(BEHAVIORAL, [
            ...behavioralFilesOf().slice(0, 2),
            sourceOf("questions/0-question/vi.md", ""),
        ])

        expect(result.draft).toBeNull()
        expect(result.issues.map((issue) => issue.path)).toContain("questions/0-question/en.md")
    })
})

describe("buildBankDraft prompts", () => {
    let subject: typeof SUBJECT

    beforeAll(async () => {
        subject = await loadSubject()
    })

    const withBody = (prompt: string): ReadonlyArray<InterviewSourceFile> =>
        technicalFilesOf().map((file) =>
            file.path.includes("bodies/0-agnostic/")
                ? {
                      ...file,
                      text: bodyOf("agnostic", { prompt })
                          .replace("Put it in the service.", CACHE_IDEAL_VI)
                          .replace("Bottom line", BOTTOM_LINE_VI),
                  }
                : file,
        )

    it("gives the learner the question stem only: the hint in parentheses is left out of the prompt", () => {
        const { draft } = subject.buildBankDraft(TECHNICAL, withBody(HINTED_PROMPT_VI))

        const stem = draft?.questions[0]?.bodies["agnostic"]?.vi.prompt ?? ""
        expect(stem).toBe(HINTED_STEM_VI)
        expect(JSON.stringify(draft?.questions[0]?.bodies)).not.toContain("MISS")
    })

    it("leaves out a question whose prompt still repeats a long run of the ideal answer, and counts it as skipped", () => {
        const files = technicalFilesOf().map((file) =>
            file.path.includes("bodies/0-agnostic/")
                ? {
                      ...file,
                      text: bodyOf("agnostic", { prompt: COPIED_PROMPT_VI }).replace(
                          /# idealAnswer[\s\S]*$/u,
                          `# idealAnswer\n<!-- @starci/seperator -->\n${COPIED_PROMPT_VI}\n<!-- @starci/seperator -->\n`,
                      ),
                  }
                : file,
        )

        const second = technicalFilesOf()
            .filter((file) => file.path.startsWith("questions"))
            .map((file) => ({ ...file, path: file.path.replace("0-question", "1-question") }))

        const { draft } = subject.buildBankDraft(TECHNICAL, [...files, ...second])

        expect(draft?.questions).toHaveLength(1)
        expect(draft?.skipped).toBe(1)
    })
})
