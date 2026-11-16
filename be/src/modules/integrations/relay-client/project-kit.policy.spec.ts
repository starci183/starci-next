import { Test } from "@nestjs/testing"
import {
    ciTemplateOf,
    isOtherConceptFlow,
    kitConfigOf,
    languageOfFiles,
    milestoneOfCatalog,
    projectIdValid,
    withIdentity,
} from "./project-kit.policy"

const POLICY: unique symbol = Symbol("spec.project-kit-policy")
const policy = { ciTemplateOf, kitConfigOf, projectIdValid, withIdentity }

const build = async (): Promise<typeof policy> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policy }],
    }).compile()
    return moduleRef.get(POLICY)
}

const YAML = `# comment
schema: starci-next-data/project-kit@1
project: "<project-id>"
language: typescript
test:
  command: node --test --test-reporter=junit --test-reporter-destination=starci/reports/junit.xml # runs
  report: starci/reports/junit.xml
start:
  command: npm start
  baseUrl: http://localhost:3000
`

describe("kitConfigOf", () => {
    it("reads the test command and report, and no project id while the placeholder is there", async () => {
        const subject = await build()
        expect(subject.kitConfigOf(YAML)).toEqual({
            projectId: null,
            testCommand: "node --test --test-reporter=junit --test-reporter-destination=starci/reports/junit.xml",
            testReport: "starci/reports/junit.xml",
        })
    })

    it("reads a project id and ignores the start block's command", async () => {
        const subject = await build()
        const text = subject.withIdentity(YAML, "7c1d2a3e-0000-4000-8000-000000000001", "go")

        expect(subject.kitConfigOf(text).projectId).toBe("7c1d2a3e-0000-4000-8000-000000000001")
        expect(subject.kitConfigOf(text).testCommand).not.toBe("npm start")
    })

    it("reads nothing from an empty file", async () => {
        const subject = await build()
        expect(subject.kitConfigOf("")).toEqual({ projectId: null, testCommand: null, testReport: null })
    })
})

const NL = String.fromCharCode(10)

describe("kitConfigOf values", () => {
    it("reads an unterminated or empty quote and a missing value as no value", async () => {
        const subject = await build()
        const text = ["test:", '  command: "never closed', '  report: ""', ""].join(NL)

        expect(subject.kitConfigOf(text)).toMatchObject({ testCommand: null, testReport: null })
        expect(subject.kitConfigOf(["test:", "  command:", ""].join(NL))).toMatchObject({ testCommand: null })
    })
})

describe("withIdentity", () => {
    it("writes the language and keeps the placeholder when no project id is given", async () => {
        const subject = await build()
        const text = subject.withIdentity(YAML, null, "java")

        expect(text).toContain("language: java")
        expect(text).toContain('project: "<project-id>"')
    })
})

describe("kit names", () => {
    it("maps a language to its CI template and refuses another", async () => {
        const subject = await build()
        expect(subject.ciTemplateOf("csharp")).toBe("2-csharp.yml")
        expect(subject.ciTemplateOf("ruby")).toBeNull()
    })

    it("refuses the placeholder as a project id", async () => {
        const subject = await build()
        expect(subject.projectIdValid("<project-id>")).toBe(false)
        expect(subject.projectIdValid("abc-123")).toBe(true)
    })
})

const CATALOG_INLINE = `milestones:
  - id: bf-http-foundation
    title:
      en: HTTP foundation
    concepts: [request-response-lifecycle, health-probe-semantics]
  - id: bf-data-and-cache
    concepts: [cache-freshness]
kinds:
  app: [bf-data-and-cache, bf-http-foundation]
  agent: [bf-http-foundation]
`

const CATALOG_BLOCK = `milestones:
  - id: first
    concepts:
      - one
      - two
  - id: second
    concepts:
      - three
`

describe("languageOfFiles", () => {
    it.each([
        [["go.mod", "main.go"], "go"],
        [["pom.xml", "src"], "java"],
        [["build.gradle.kts"], "java"],
        [["Shop.csproj"], "csharp"],
        [["Shop.sln"], "csharp"],
        [["package.json", "tsconfig.json"], "typescript"],
        [["README.md"], null],
        [[], null],
    ])("reads %j as %s", (names, expected) => {
        expect(languageOfFiles(names)).toBe(expected)
    })

    it("prefers the compiled language of a mixed folder over its tooling package.json", () => {
        expect(languageOfFiles(["package.json", "go.mod"])).toBe("go")
    })
})

describe("milestoneOfCatalog", () => {
    it("reads the inline spelling and the first milestone of the app kind by default", () => {
        expect(milestoneOfCatalog(CATALOG_INLINE, null)).toEqual({
            id: "bf-data-and-cache",
            concepts: ["cache-freshness"],
        })
    })

    it("reads the milestone it is asked for, and the block spelling", () => {
        expect(milestoneOfCatalog(CATALOG_INLINE, "bf-http-foundation")?.concepts).toEqual([
            "request-response-lifecycle",
            "health-probe-semantics",
        ])
        expect(milestoneOfCatalog(CATALOG_BLOCK, null)).toEqual({ id: "first", concepts: ["one", "two"] })
        expect(milestoneOfCatalog(CATALOG_BLOCK, "second")?.concepts).toEqual(["three"])
    })

    it("answers null for a milestone the catalog does not list, and for a catalog with none", () => {
        expect(milestoneOfCatalog(CATALOG_INLINE, "nope")).toBeNull()
        expect(milestoneOfCatalog("concepts: []\n", null)).toBeNull()
    })
})

describe("isOtherConceptFlow", () => {
    it("leaves out the e2e flow of a concept outside the milestone only", () => {
        const concepts = new Set(["idempotency"])

        expect(isOtherConceptFlow("starci/e2e/idempotency.md", concepts)).toBe(false)
        expect(isOtherConceptFlow("starci/e2e/saga.md", concepts)).toBe(true)
        expect(isOtherConceptFlow("starci/project.yaml", concepts)).toBe(false)
        expect(isOtherConceptFlow("starci/e2e/saga.md", null)).toBe(false)
    })
})
