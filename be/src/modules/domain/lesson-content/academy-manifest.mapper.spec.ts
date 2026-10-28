import { Test } from "@nestjs/testing"
import { LessonContentErrorCode } from "./errors/lesson-content.error"
import { parseFixtureManifest } from "./academy-manifest.mapper"

const HASH = "a".repeat(64)

const range = () => ({ start: 0, end: 10 })

const article = () => ({
    programmingLanguage: "typescript",
    locale: "en",
    fixturePath: "original/bodies/0-typescript/en.md",
    offsetUnit: "byte",
    article: { ...range(), sha256: HASH },
    section1: { ...range(), sha256: HASH },
    outline: [{ id: "section-1", depth: 2, text: "1. Opening", ...range() }],
    protectedRanges: [{ ...range(), kind: "interviewerPoints" }],
    interviewQuestions: [
        { id: "interview-1", promptStart: 0, promptEnd: 5, protectedRanges: [{ ...range(), kind: "sampleAnswer" }] },
    ],
    publicArticleRanges: [range()],
})

const file = () => ({
    sourcePath: "D:/src/en.md",
    fixturePath: "original/en.md",
    bytes: 10,
    sha256: HASH,
    classification: "server-only raw input",
})

const manifest = () => ({
    schema: "lessons.fixture-provenance@1",
    id: "fixture.lessons.academy-rest-semantics.v1",
    version: "1.0.0",
    capturedAt: "2026-10-28T00:00:00.000Z",
    sourceReadOnly: true,
    sourceRoot: "D:/src",
    sourceRepository: "D:/repo",
    gitRevision: "abc",
    sourceDirtyPaths: [],
    programmingLanguages: ["typescript"],
    locales: ["en"],
    files: [file()],
    articles: [article()],
})

const invalid = LessonContentErrorCode.ManifestInvalid

const SUBJECT = Symbol("academy-manifest")
const helpers = { parseFixtureManifest }

/** Builds the subject through the testing module, the way consumers reach it. */
const build = async (): Promise<typeof helpers> =>
    (await Test.createTestingModule({ providers: [{ provide: SUBJECT, useFactory: () => helpers }] }).compile()).get<
        typeof helpers
    >(SUBJECT)

describe("parseFixtureManifest validates the envelope", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })

    const parse = (value: unknown) => () => subject.parseFixtureManifest(JSON.stringify(value))

    it("parses the recorded shape and derives the content id from the fixture id", () => {
        const parsed = subject.parseFixtureManifest(JSON.stringify(manifest()))

        expect(parsed.contentId).toBe("academy-rest-semantics")
        expect(parsed.version).toBe("1.0.0")
        expect(parsed.files).toHaveLength(1)
        expect(parsed.articles).toHaveLength(1)
    })

    it("refuses text that is not JSON and a root that is not an object", () => {
        expect(() => subject.parseFixtureManifest("{")).toThrow(invalid)
        expect(parse([1])).toThrow(invalid)
    })

    it("refuses a schema it does not know", () => {
        expect(parse({ ...manifest(), schema: "other@1" })).toThrow(invalid)
    })

    it("refuses a missing or malformed fixture id", () => {
        expect(parse({ ...manifest(), id: 1 })).toThrow(invalid)
        expect(parse({ ...manifest(), id: "other.id" })).toThrow(invalid)
    })

    it("refuses a missing version", () => {
        expect(parse({ ...manifest(), version: 1 })).toThrow(invalid)
    })

    it("refuses empty or non-string locale and language axes", () => {
        expect(parse({ ...manifest(), locales: [] })).toThrow(invalid)
        expect(parse({ ...manifest(), locales: [""] })).toThrow(invalid)
        expect(parse({ ...manifest(), programmingLanguages: [] })).toThrow(invalid)
        expect(parse({ ...manifest(), programmingLanguages: [1] })).toThrow(invalid)
    })
})

describe("parseFixtureManifest validates the records", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })

    const parse = (value: unknown) => () => subject.parseFixtureManifest(JSON.stringify(value))

    it("refuses malformed file records", () => {
        expect(parse({ ...manifest(), files: "x" })).toThrow(invalid)
        expect(parse({ ...manifest(), files: [{ ...file(), sourcePath: "" }] })).toThrow(invalid)
        expect(parse({ ...manifest(), files: [{ ...file(), fixturePath: "" }] })).toThrow(invalid)
        expect(parse({ ...manifest(), files: [{ ...file(), bytes: -1 }] })).toThrow(invalid)
        expect(parse({ ...manifest(), files: [{ ...file(), bytes: 1.5 }] })).toThrow(invalid)
        expect(parse({ ...manifest(), files: [{ ...file(), sha256: "zz" }] })).toThrow(invalid)
    })

    it("refuses malformed article records", () => {
        expect(parse({ ...manifest(), articles: "x" })).toThrow(invalid)
        expect(parse({ ...manifest(), articles: [{ ...article(), programmingLanguage: 1 }] })).toThrow(invalid)
        expect(parse({ ...manifest(), articles: [{ ...article(), locale: "" }] })).toThrow(invalid)
        expect(parse({ ...manifest(), articles: [{ ...article(), fixturePath: "" }] })).toThrow(invalid)
        expect(
            parse({ ...manifest(), articles: [{ ...article(), article: { start: 5, end: 2, sha256: HASH } }] }),
        ).toThrow(invalid)
        expect(
            parse({ ...manifest(), articles: [{ ...article(), article: { start: "x", end: 2, sha256: HASH } }] }),
        ).toThrow(invalid)
        expect(
            parse({ ...manifest(), articles: [{ ...article(), article: { start: 0, end: "x", sha256: HASH } }] }),
        ).toThrow(invalid)
        expect(parse({ ...manifest(), articles: [{ ...article(), article: range() }] })).toThrow(invalid)
        expect(parse({ ...manifest(), articles: [{ ...article(), section1: range() }] })).toThrow(invalid)
    })

    it("refuses malformed outline entries", () => {
        const bad = (outline: unknown) => parse({ ...manifest(), articles: [{ ...article(), outline }] })

        expect(bad("x")).toThrow(invalid)
        expect(bad([{ id: 1, depth: 2, text: "t", ...range() }])).toThrow(invalid)
        expect(bad([{ id: "s", depth: "2", text: "t", ...range() }])).toThrow(invalid)
        expect(bad([{ id: "s", depth: 2, text: "", ...range() }])).toThrow(invalid)
    })
})

describe("parseFixtureManifest validates the interview records", () => {
    let subject: typeof helpers

    beforeAll(async () => {
        subject = await build()
    })

    const parse = (value: unknown) => () => subject.parseFixtureManifest(JSON.stringify(value))

    it("refuses malformed protected ranges and interview questions", () => {
        expect(
            parse({ ...manifest(), articles: [{ ...article(), protectedRanges: [{ ...range(), kind: "other" }] }] }),
        ).toThrow(invalid)
        expect(parse({ ...manifest(), articles: [{ ...article(), interviewQuestions: "x" }] })).toThrow(invalid)
        expect(
            parse({
                ...manifest(),
                articles: [
                    {
                        ...article(),
                        interviewQuestions: [{ id: 1, promptStart: 0, promptEnd: 1, protectedRanges: [] }],
                    },
                ],
            }),
        ).toThrow(invalid)
        expect(
            parse({
                ...manifest(),
                articles: [
                    {
                        ...article(),
                        interviewQuestions: [
                            {
                                id: "i",
                                promptStart: 0,
                                promptEnd: 1,
                                protectedRanges: [{ start: 0, end: 1, kind: "x" }],
                            },
                        ],
                    },
                ],
            }),
        ).toThrow(invalid)
    })

    it("refuses malformed public article ranges", () => {
        expect(
            parse({ ...manifest(), articles: [{ ...article(), publicArticleRanges: [{ start: 9, end: 2 }] }] }),
        ).toThrow(invalid)
        expect(parse({ ...manifest(), articles: [{ ...article(), publicArticleRanges: "x" }] })).toThrow(invalid)
    })
})
