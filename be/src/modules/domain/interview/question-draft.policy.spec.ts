import { Test } from "@nestjs/testing"
import {
    behavioralFilesOf,
    behavioralQuestionOf,
    bodyOf,
    fieldOf,
    objectsOf,
    technicalFilesOf,
    technicalQuestionOf,
} from "@tests/fixtures/builders/interview.builder"
import type { InterviewFamily, InterviewIssue } from "./interview.contracts"
import { questionDraftOf, type QuestionTexts } from "./question-draft.policy"
import { LAYER_QUESTION_VI } from "@tests/fixtures/i18n/interview-spec.messages"

const POLICY: unique symbol = Symbol("spec.question-draft-policy")

const build = async (): Promise<typeof questionDraftOf> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => questionDraftOf }],
    }).compile()
    return moduleRef.get<typeof questionDraftOf>(POLICY)
}

const FOLDER = "0-question"
const BANK = "bank/one"
const PREFIX = `questions/${FOLDER}/`
const MARK = "<!-- @starci/seperator -->"

/** The texts of the question folder of a bank's files, by path relative to the folder. */
const textsOf = (files: ReadonlyArray<{ readonly path: string; readonly text: string }>): Map<string, string> =>
    new Map(
        files.filter((file) => file.path.startsWith(PREFIX)).map((file) => [file.path.slice(PREFIX.length), file.text]),
    )

const technical = (): Map<string, string> => textsOf(technicalFilesOf())
const behavioral = (): Map<string, string> => textsOf(behavioralFilesOf())

const read = async (
    texts: QuestionTexts,
    family: InterviewFamily = "technical",
    folder = FOLDER,
    issues: Array<InterviewIssue> = [],
) => {
    const draftOf = await build()
    return { outcome: draftOf(BANK, folder, family, texts, issues), issues }
}

const fields = (issues: ReadonlyArray<InterviewIssue>): Array<string> => issues.map((issue) => issue.field)

const messages = (issues: ReadonlyArray<InterviewIssue>, field: string): Array<string> =>
    issues.filter((issue) => issue.field === field).map((issue) => issue.message)

const differences = (issues: ReadonlyArray<InterviewIssue>): Array<string> =>
    fields(issues.filter((issue) => issue.message === "differs between vi and en"))

/** The technical texts with the vi and en question files replaced. */
const technicalWith = (vi: string, en: string = vi): Map<string, string> =>
    new Map([...technical(), ["vi.md", vi], ["en.md", en]])

const exampleWith = (entries: unknown): Map<string, string> =>
    technicalWith(
        technicalQuestionOf({ exampleResults: typeof entries === "string" ? entries : JSON.stringify(entries) }),
    )

/** A list item appended after the header of a list field. */
const withItem = (text: string, name: string, index: number): string =>
    text.replace(`# ${name}\n`, `# ${name}\n## ${index}\n${MARK}\nMore\n${MARK}\n`)

describe("questionDraftOf technical", () => {
    it("reads a valid folder into a draft with the stemmed bodies, the grading of both locales and the ideal answers", async () => {
        const { outcome, issues } = await read(technical())

        expect(issues).toEqual([])
        expect(outcome.kind).toBe("draft")
        if (outcome.kind !== "draft") return
        expect(outcome.draft).toMatchObject({
            questionId: `${BANK}/0`,
            family: "technical",
            tier: "junior",
            kind: "theory",
            competency: null,
            leadershipTier: null,
            tags: ["layers"],
        })
        expect(outcome.draft.bodies["agnostic"]).toEqual({
            vi: { prompt: LAYER_QUESTION_VI, givenCode: null, diagram: null },
            en: { prompt: "Where does this logic belong?", givenCode: null, diagram: null },
        })
        expect(outcome.draft.interviewer.vi).toEqual({
            followUps: ["Why that layer?"],
            hints: ["Think about who owns the shape.", "Look at the error path."],
        })
        expect(outcome.draft.grading.locales.en.checklist).toHaveLength(2)
        expect(outcome.draft.grading.locales.en.exampleResults).toHaveLength(5)
        expect(outcome.draft.grading.ideal["agnostic"]?.en).toContain("Put it in the service.")
    })

    it("carries the diagram and the given code of a question into its bodies", async () => {
        const texts = technicalWith(technicalQuestionOf({ diagram: "graph TD" }))
        texts.set("bodies/0-agnostic/en.md", bodyOf("agnostic", { givenCode: "const a = 1" }))

        const { outcome } = await read(texts)

        expect(outcome.kind === "draft" && outcome.draft.bodies["agnostic"]?.en).toEqual({
            prompt: "Where does this logic belong?",
            givenCode: "const a = 1",
            diagram: "graph TD",
        })
    })

    it("numbers the question by its folder, and 0 when the folder has no number", async () => {
        const named = await read(technical(), "technical", "7-seven")
        const plain = await read(technical(), "technical", "plain")

        expect(named.outcome.kind === "draft" && named.outcome.draft.questionId).toBe(`${BANK}/7`)
        expect(plain.outcome.kind === "draft" && plain.outcome.draft.questionId).toBe(`${BANK}/0`)
    })

    it.each(["design", "coding"])("skips the %s kind without an issue", async (kind) => {
        const { outcome, issues } = await read(technicalWith(technicalQuestionOf({ kind })))

        expect(outcome).toEqual({ kind: "skipped" })
        expect(issues).toEqual([])
    })
})

describe("questionDraftOf technical (continued)", () => {
    it("skips a question whose prompt repeats the ideal answer, whichever body does it", async () => {
        const ideal = Array.from({ length: 24 }, (_value, index) => `word${index}`).join(" ")
        const leaking = (name: string): string =>
            [fieldOf("lang", name), fieldOf("prompt", ideal), fieldOf("idealAnswer", ideal)].join("")
        const texts = technical()
        texts.set("bodies/0-agnostic/vi.md", leaking("agnostic"))
        texts.set("bodies/0-agnostic/en.md", leaking("agnostic"))
        texts.set("bodies/1-other/vi.md", bodyOf("other"))
        texts.set("bodies/1-other/en.md", bodyOf("other"))

        const { outcome, issues } = await read(texts)

        expect(outcome).toEqual({ kind: "skipped" })
        expect(issues).toEqual([])
    })

    it("is invalid, with an issue at the bodies folder, when a technical question has no body", async () => {
        const texts = new Map([...technical()].filter(([path]) => !path.startsWith("bodies/")))

        const { outcome, issues } = await read(texts)

        expect(outcome).toEqual({ kind: "invalid" })
        expect(issues).toEqual([
            { path: `${PREFIX}bodies`, field: "", message: "a technical question needs at least one body" },
        ])
    })

    it("names a body whose language differs between vi and en, and a missing locale file", async () => {
        const texts = technical()
        texts.set("bodies/0-agnostic/en.md", bodyOf("typescript"))
        texts.delete("en.md")

        const { outcome, issues } = await read(texts)

        expect(outcome.kind).toBe("invalid")
        expect(issues).toContainEqual({
            path: `${PREFIX}bodies/0-agnostic`,
            field: "lang",
            message: "differs between vi and en",
        })
        expect(issues.some((issue) => issue.path === `${PREFIX}en.md` && issue.message === "is missing or empty")).toBe(
            true,
        )
    })

    it("names what differs between the vi and en question files", async () => {
        const vi = technicalQuestionOf({ tier: "junior", diagram: "graph TD" })
        const en = technicalQuestionOf({
            tier: "senior",
            exampleResults: JSON.stringify([{ level: 9, answer: "x", sonnet: 1, haiku: 1 }]),
            checklist: JSON.stringify([{ text: "Only", dimension: "technical", critical: "false", scoreBand: "100" }]),
        })

        const { outcome, issues } = await read(technicalWith(vi, en))

        expect(outcome.kind).toBe("invalid")
        expect(differences(issues)).toEqual(["meta", "diagram", "checklist", "exampleResults"])
    })
})

describe("questionDraftOf technical (continued) (continued)", () => {
    it("names a difference in the number of follow-ups, hints, rubric lines and keywords", async () => {
        const vi = technicalQuestionOf()
        const en = ["followUps", "hints", "rubric", "keywords"].reduce(
            (text, name, index) => withItem(text, name, index + 5),
            vi,
        )

        const { issues } = await read(technicalWith(vi, en))

        expect(differences(issues)).toEqual(["followUps", "hints", "rubric", "keywords"])
    })

    it("reads a body folder that has only one locale file, naming the missing one", async () => {
        const texts = technical()
        texts.delete("bodies/0-agnostic/en.md")

        const { outcome, issues } = await read(texts)

        expect(outcome.kind).toBe("invalid")
        expect(issues.filter((issue) => issue.path === `${PREFIX}bodies/0-agnostic/en.md`)).not.toHaveLength(0)
    })

    it("names every fault of a checklist item and a score total that is not 100", async () => {
        const checklist = JSON.stringify([{ text: "", dimension: "mystery", critical: "maybe", scoreBand: "lots" }, {}])

        const { outcome, issues } = await read(technicalWith(technicalQuestionOf({ checklist })))

        expect(outcome.kind).toBe("invalid")
        expect(messages(issues, "checklist[0].dimension")[0]).toContain("expected one of")
        expect(messages(issues, "checklist[0].critical")).toContain("expected true or false")
        expect(messages(issues, "checklist[0].scoreBand")).toContain("expected a whole number")
        expect(messages(issues, "checklist[0].text")).toContain("is missing or empty")
        expect(messages(issues, "checklist[1].text")).toContain("is missing or empty")
        expect(messages(issues, "checklist")).toContain("score bands sum to 0, expected 100")
    })

    it("names a missing checklist", async () => {
        const vi = technicalQuestionOf().replace(/# checklist[\s\S]*?(?=# exampleResults)/u, objectsOf("checklist", []))

        const { issues } = await read(technicalWith(vi))

        expect(messages(issues, "checklist")).toContain("is missing or empty")
    })
})

describe("questionDraftOf technical (continued) (continued) (continued)", () => {
    it("names a blank example field once per locale", async () => {
        const { issues } = await read(technicalWith(technicalQuestionOf({ exampleResults: " " })))

        expect(messages(issues, "exampleResults")).toEqual(["is missing or empty", "is missing or empty"])
    })

    it("tells the parse failure from the shape failure", async () => {
        const parse = await read(technicalWith(technicalQuestionOf({ exampleResults: "{" })))
        const shape = await read(technicalWith(technicalQuestionOf({ exampleResults: "{}" })))

        expect(messages(parse.issues, "exampleResults")[0]).toContain("is not valid json")
        expect(messages(shape.issues, "exampleResults")[0]).toBe("expected a list of {level, answer, sonnet, haiku}")
    })

    it.each([
        ["an empty list", []],
        ["an entry that is not an object", ["text"]],
        ["a level that is not a number", [{ level: "1", answer: "a", sonnet: 1, haiku: 1 }]],
        ["an answer that is not a text", [{ level: 1, answer: 5, sonnet: 1, haiku: 1 }]],
        ["a blank answer", [{ level: 1, answer: "  ", sonnet: 1, haiku: 1 }]],
        ["a sonnet score that is not a number or null", [{ level: 1, answer: "a", sonnet: "1", haiku: 1 }]],
        ["a sonnet score that is infinite", '[{"level":1,"answer":"a","sonnet":1e999,"haiku":1}]'],
        ["a haiku score that is missing", [{ level: 1, answer: "a", sonnet: 1 }]],
        [
            "one good entry beside a bad one",
            [
                { level: 1, answer: "a", sonnet: 1, haiku: 1 },
                { level: 2, answer: "", sonnet: 1, haiku: 1 },
            ],
        ],
    ])("flags exampleResults with %s", async (_case, entries) => {
        const { issues } = await read(exampleWith(entries))

        expect(messages(issues, "exampleResults")).toHaveLength(2)
    })

    it("accepts null scores in the examples", async () => {
        const { issues } = await read(exampleWith([{ level: 1, answer: "a", sonnet: null, haiku: 0 }]))

        expect(issues).toEqual([])
    })

    it("is invalid when the file names the other family than the bank", async () => {
        const { outcome, issues } = await read(behavioral(), "technical")

        expect(outcome.kind).toBe("invalid")
        expect(messages(issues, "family")).toContain("the bank is technical")
    })
})

describe("questionDraftOf behavioural", () => {
    it("reads a valid folder into a draft with the STAR rubric, the ownership signal and one agnostic body", async () => {
        const { outcome, issues } = await read(behavioral(), "behavioral")

        expect(issues).toEqual([])
        expect(outcome.kind).toBe("draft")
        if (outcome.kind !== "draft") return
        expect(outcome.draft).toMatchObject({
            questionId: `${BANK}/0`,
            family: "behavioral",
            competency: "conflict",
            leadershipTier: null,
        })
        expect(outcome.draft.bodies["agnostic"]?.vi).toEqual({
            prompt: "Tell me about a disagreement.",
            givenCode: null,
            diagram: null,
        })
        expect(outcome.draft.grading.locales.vi.star).toHaveLength(6)
        expect(outcome.draft.grading.locales.en.ownershipSignal).toBe("Deduct for we-only action.")
        expect(outcome.draft.interviewer.en).toEqual({ followUps: [], hints: [] })
    })

    it("carries the leadership tier when the file has one", async () => {
        const texts = new Map([...behavioral(), ["vi.md", behavioralQuestionOf({ leadershipTier: "lead" })]])

        const { outcome } = await read(texts, "behavioral")

        expect(outcome.kind === "draft" && outcome.draft.leadershipTier).toBe("lead")
    })

    it("flags rubric lines with no prefix or an unknown dimension, and a rubric without the six dimensions once each", async () => {
        const rubric = JSON.stringify([
            "no prefix",
            "[mystery] unknown",
            "[situationClarity] once",
            "[situationClarity] twice",
        ])

        const { outcome, issues } = await read(
            new Map([...behavioral(), ["vi.md", behavioralQuestionOf({ rubric })]]),
            "behavioral",
        )

        expect(outcome.kind).toBe("invalid")
        expect(messages(issues, "rubric[0]")[0]).toContain("expected a [")
        expect(messages(issues, "rubric[1]")[0]).toContain("expected a [")
        expect(messages(issues, "rubric[2]")).toEqual([])
        expect(messages(issues, "rubric")).toEqual(["needs exactly the six STAR dimensions, once each"])
    })

    it("names a difference of meta and competency between the vi and en files", async () => {
        const en = behavioralQuestionOf().replace("junior", "senior").replace("conflict", "ownership")

        const { issues } = await read(new Map([...behavioral(), ["en.md", en]]), "behavioral")

        expect(differences(issues)).toEqual(["meta", "competency"])
    })

    it("is invalid when the file names the other family than the bank", async () => {
        const { outcome, issues } = await read(technical(), "behavioral")

        expect(outcome.kind).toBe("invalid")
        expect(messages(issues, "family")).toContain("the bank is behavioral")
    })

    it("reads a question folder without any file as invalid, naming every missing field", async () => {
        const { outcome, issues } = await read(new Map(), "behavioral")

        expect(outcome.kind).toBe("invalid")
        expect(fields(issues)).toContain("competency")
    })
})
