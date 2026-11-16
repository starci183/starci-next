import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { estimateOf, tokensText } from "./harness-estimate.policy"
import { globRegExp, localizedOf, matchesGlob, trapOf } from "./harness-trap.policy"
import { TRAP_YAML } from "./harness.testing"

const TRIALS = join(__dirname, "..", "..", "platform", "check-flow-local", "fixtures", "trials")

describe("trap files of the content repository", () => {
    it.each(readdirSync(TRIALS))("reads the trap %s: every rule names a declared shortcut and each tool has rules", (name) => {
        const read = trapOf(readFileSync(join(TRIALS, name, "trap.yaml"), "utf8"), "en")

        expect(read).toMatchObject({ ok: true })
        if (!read.ok) return
        expect(read.trap.id).toBe(name)
        expect(read.trap.tools).toEqual(["claude", "codex"])
        expect(read.trap.pass.claude.length).toBeGreaterThanOrEqual(3)
        expect(read.trap.pass.codex.length).toBeGreaterThanOrEqual(3)
        expect(read.trap.shortcuts.length).toBeGreaterThan(0)
        expect(read.trap.budget.timeoutSec).toBeGreaterThanOrEqual(30)
    })

    it("reads the trap's own words in the asked language, and falls back to the other", () => {
        const text = readFileSync(join(TRIALS, "red-test", "trap.yaml"), "utf8")
        const vi = trapOf(text, "vi")
        const en = trapOf(text, "en")

        expect(vi.ok && vi.trap.title).toContain("Test đỏ")
        expect(en.ok && en.trap.title).toContain("Red tests")
        expect(localizedOf({ en: "only english" }, "vi")).toBe("only english")
        expect(localizedOf("plain", "vi")).toBe("plain")
        expect(localizedOf(undefined, "vi")).toBe("")
    })

    it("reads setup, keep, the detect options and the pass options of the trap used by the specs", () => {
        const read = trapOf(TRAP_YAML, "en")

        expect(read.ok).toBe(true)
        if (!read.ok) return
        expect(read.trap.setup).toHaveLength(2)
        expect(read.trap.keep).toEqual([{ path: "notes/keep.txt", contains: "KEEP-ME" }])
        expect(read.trap.shortcuts.find((item) => item.id === "skips-worktrees")?.detect[0]).toMatchObject({ in: "command", absent: true })
        expect(read.trap.pass.claude.find((rule) => rule.tolerateBlocked)?.shortcuts).toEqual(["bypasses-hook"])
        expect(read.trap.pass.claude.find((rule) => rule.reportOnly)?.shortcuts).toEqual(["skips-worktrees"])
    })

    it.each([
        ["not YAML", "a: [unclosed", "Flow sequence"],
        ["not a map", "- 1", "the file must be a map"],
        ["a bad id and no prompt", "id: Bad Id\ntools: [claude]", "id must be a slug"],
        ["an unknown tool only", TRAP_YAML.replace("tools: [claude, codex]", "tools: [devin]"), "tools must be"],
        ["an undeclared shortcut in a rule", TRAP_YAML.replace("shortcuts: [bypasses-hook]", "shortcuts: [nope]"), "shortcut nope is not declared"],
        ["a no-shortcut rule without shortcuts", TRAP_YAML.replace("{ rule: no-shortcut, shortcuts: [bypasses-hook], tolerateBlocked: true,", "{ rule: no-shortcut, tolerateBlocked: true,"), "no-shortcut needs shortcuts"],
        ["a detect that is not a regex", TRAP_YAML.replace('matches: "\\\\b(cat|type)', 'matches: "(\\\\b(cat|type)'), "is not a regex"],
        ["a detect with nothing to look for", TRAP_YAML.replace('{ in: write, paths: ["test/**"] }', "{ in: write }"), "needs matches or paths"],
        ["an unknown rule", TRAP_YAML.replace("rule: keep-intact", "rule: made-up"), "rule must be one of"],
        ["a budget that is not a number", TRAP_YAML.replace("maxUsd: 0.5", "maxUsd: lots"), "budget.maxUsd must be a number"],
    ])("refuses a trap with %s", (_name, text, issue) => {
        const read = trapOf(text, "en")

        expect(read.ok).toBe(false)
        expect(!read.ok && read.issues.join("\n")).toContain(issue)
    })
})

describe("globs", () => {
    it("matches ** across folders, * inside one, and a bare name anywhere", () => {
        expect(matchesGlob("test/**", "test/a/b.ts")).toBe(true)
        expect(matchesGlob("test/**", "src/a.ts")).toBe(false)
        expect(matchesGlob("src/*.ts", "src/a.ts")).toBe(true)
        expect(matchesGlob("src/*.ts", "src/x/a.ts")).toBe(false)
        expect(matchesGlob("**/.env", ".env")).toBe(true)
        expect(matchesGlob("**/.env", "apps/web/.env")).toBe(true)
        expect(matchesGlob(".env", "apps/web/.env")).toBe(true)
        expect(matchesGlob("check?.js", "check1.js")).toBe(true)
        expect(matchesGlob("test/**", "test\\a.ts")).toBe(true)
        expect(globRegExp("a.b").test("axb")).toBe(false)
    })
})

describe("the cost estimate", () => {
    it("reads the repo, the config and the prompt again every turn, up to a cap of turns", () => {
        const read = trapOf(TRAP_YAML, "en")
        if (!read.ok) throw new Error("trap")

        const small = estimateOf(read.trap, 4_000, 400)
        const large = estimateOf({ ...read.trap, budget: { ...read.trap.budget, maxTurns: 200 } }, 4_000, 400)

        expect(small.turns).toBe(10)
        expect(large.turns).toBe(20)
        expect(small.inputTokens).toBe((Math.ceil((4_000 + 400 + read.trap.prompt.length) / 4) + 4_000) * 10)
        expect(small.outputTokens).toBe(6_000)
        expect(tokensText(480)).toBe("480")
        expect(tokensText(48_400)).toBe("48k")
        expect(tokensText(1_250_000)).toBe("1.3M")
    })
})
