import {
    LESSON_REFERENCES,
    REFERENCE_ORG,
    type LessonReference,
    isReferencePinned,
    pinnedReferenceOfLesson,
    referenceCommandOf,
    referenceLanguageOf,
    referenceNamed,
    referenceTarballRootOf,
    referenceTarballUrlOf,
    referenceTreeUrlOf,
} from "./lesson-reference"

const SHA = "fedcba9876543210fedcba9876543210fedcba98"

const demo = (commit = SHA): LessonReference => ({
    name: "demo",
    lessons: ["demo-lesson"],
    repo: "starci-next/essential-demo",
    commit,
    checked: "2026-11-26",
    languages: [
        { id: "typescript", folder: "typescript", label: "TypeScript (NestJS)" },
        { id: "go", folder: "go", label: "Go" },
    ],
})

describe("lesson references", () => {
    it("names each reference repository essential-<name> in the starci-next organisation, one folder per language", () => {
        for (const reference of LESSON_REFERENCES) {
            expect(reference.repo).toBe(`${REFERENCE_ORG}/essential-${reference.name}`)
            expect(reference.languages.length).toBeGreaterThan(0)
            expect(reference.languages.every((language) => /^[a-z]+$/u.test(language.folder))).toBe(true)
        }
    })

    it("pins every listed reference to a full commit sha", () => {
        expect(LESSON_REFERENCES.every(isReferencePinned)).toBe(true)
        expect(isReferencePinned(demo("main"))).toBe(false)
        expect(isReferencePinned(demo(SHA.slice(0, 7)))).toBe(false)
        expect(isReferencePinned(demo(SHA.toUpperCase()))).toBe(false)
    })

    it("finds a reference by its short name or a lesson id it answers, and nothing else", () => {
        expect(referenceNamed("demo", [demo()])?.name).toBe("demo")
        expect(referenceNamed("demo-lesson", [demo()])?.name).toBe("demo")
        expect(referenceNamed("other", [demo()])).toBeUndefined()
        expect(pinnedReferenceOfLesson("demo-lesson", [demo()])?.name).toBe("demo")
        expect(pinnedReferenceOfLesson("demo-lesson", [demo("main")])).toBeUndefined()
    })

    it("takes the first language by default and refuses one the repository has no folder for", () => {
        expect(referenceLanguageOf(demo(), undefined)?.id).toBe("typescript")
        expect(referenceLanguageOf(demo(), "go")?.folder).toBe("go")
        expect(referenceLanguageOf(demo(), "rust")).toBeUndefined()
    })

    it("builds every link and the command from the one pinned commit", () => {
        const language = demo().languages[0]!
        expect(referenceTreeUrlOf(demo(), language)).toBe(`https://github.com/starci-next/essential-demo/tree/${SHA}/typescript`)
        expect(referenceTarballUrlOf(demo())).toBe(`https://codeload.github.com/starci-next/essential-demo/tar.gz/${SHA}`)
        expect(referenceTarballRootOf(demo())).toBe(`essential-demo-${SHA}`)
        expect(referenceCommandOf(demo(), language)).toBe("starci-relay ref demo --lang typescript")
    })
})
