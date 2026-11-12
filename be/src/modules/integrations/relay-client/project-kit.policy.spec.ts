import { Test } from "@nestjs/testing"
import { ciTemplateOf, kitConfigOf, projectIdValid, withIdentity } from "./project-kit.policy"

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
