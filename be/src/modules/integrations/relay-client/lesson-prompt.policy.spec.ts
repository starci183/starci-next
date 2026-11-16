import type { LastRun, LessonSection } from "./lesson.contracts"
import { fixPromptOf } from "./lesson-prompt.policy"

const LESSON: LessonSection = {
    lessonId: "outbox",
    source: { url: "https://x.test/s.tar.gz", sha256: "d".repeat(64), commit: "a".repeat(40) },
    dir: ".",
    compose: ".docker",
    project: "outbox",
    invariants: { "idempotency-key": "One command, one effect" },
    scenarios: [
        {
            id: "dup-submit",
            title: "Duplicate submit",
            brief: "Send the same command twice.",
            concepts: [],
            command: "c",
            cwd: ".",
            report: "r",
            timeoutMs: 1,
            guards: [],
            files: [],
        },
    ],
}
const RED: LastRun = {
    scenarioId: "dup-submit",
    passed: false,
    guardsOff: ["idempotency-key"],
    failing: [{ name: "second call", message: "[invariant:idempotency-key] charged twice" }],
    invariantIds: ["idempotency-key"],
}

describe("fixPromptOf", () => {
    it("names the scenario, the observation and the revealed invariant, and asks for a fix without giving one", () => {
        const prompt = fixPromptOf(LESSON, "dup-submit", RED)
        const text = prompt.kind === "prompt" ? prompt.text : ""

        expect(text).toContain("Duplicate submit")
        expect(text).toContain("Send the same command twice.")
        expect(text).toContain("- second call: charged twice")
        expect(text).toContain("One command, one effect (idempotency-key)")
        expect(text).toContain("starci-next check outbox --scenario dup-submit")
        expect(text).not.toContain("[invariant:")
    })

    it("holds back the invariant when no run revealed it", () => {
        const last = { ...RED, invariantIds: [], failing: [{ name: "second call", message: "charged twice" }] }
        const prompt = fixPromptOf(LESSON, "dup-submit", last)

        expect(prompt.kind === "prompt" ? prompt.text : "").not.toContain("The rule that is broken")
    })

    it.each([
        ["no run yet", null, "Run it first"],
        ["a passing run", { ...RED, passed: true }, "nothing to fix"],
    ])("gives no prompt after %s", (_name, last, line) => {
        const prompt = fixPromptOf(LESSON, "dup-submit", last)

        expect(prompt.kind).toBe("none")
        expect(prompt.kind === "none" ? prompt.line : "").toContain(line)
    })

    it("refuses an unknown scenario", () => {
        expect(fixPromptOf(LESSON, "nope", RED).kind).toBe("none")
    })
})
