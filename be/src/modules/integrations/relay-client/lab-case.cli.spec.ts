import { execSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import type { CheckRun, CliIo } from "./relay-client.contracts"
import { caseDiffCommand, caseListCommand, caseResetToCommand, caseRunCommand } from "./lab-case.cli"
import { LADDER_BASE, LADDER_REFS, LEARNER_FILE, manifestYaml, reportXml } from "./lab-manifest.testing"
import { worldOf, type World } from "./lesson.testing"
import { readQueue } from "./upload-queue.adapter"

/** git with a fixed identity, so a commit works on a machine with no git config (CI). */
const GIT_ENV = {
    GIT_AUTHOR_NAME: "learner",
    GIT_AUTHOR_EMAIL: "learner@example.invalid",
    GIT_COMMITTER_NAME: "learner",
    GIT_COMMITTER_EMAIL: "learner@example.invalid",
}

const really = (command: string, cwd: string): CheckRun => {
    try {
        const output = execSync(command, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...GIT_ENV } })
        return { exitCode: 0, output, durationMs: 1 }
    } catch (error) {
        const failed = error as { status?: number; stdout?: string; stderr?: string }
        return { exitCode: failed.status ?? 1, output: `${failed.stdout ?? ""}${failed.stderr ?? ""}`, durationMs: 1 }
    }
}

const write = (root: string, path: string, text: string): void => {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
}

/**
 * A lab checkout as a learner has it: the manifest, the learner file at c0, the ladder's first two rungs tagged, and the learner's own
 * branch `bai` cut from c0. Git runs for real; the cases command writes a report where the ids in `green` pass and the rest fail.
 */
const labOf = (): { readonly world: World; readonly io: CliIo; readonly root: string; readonly green: Set<string> } => {
    const world = worldOf(undefined)
    const root = mkdtempSync(join(tmpdir(), "starci-lab2-"))
    const green = new Set<string>()
    const sh = (command: string): string => {
        const run = really(command, root)
        if (run.exitCode !== 0) throw new Error(`${command}: ${run.output}`)
        return run.output
    }
    write(root, "starci-lab.yaml", manifestYaml({ testCases: "node cases.js {ids}" }))
    write(root, ".gitignore", "reports/\n")
    write(root, LEARNER_FILE, "export const STEPS = ['c0']\n")
    sh("git init -q -b main")
    sh("git add -A")
    sh('git commit -q -m "c0"')
    sh(`git tag ${LADDER_BASE}`)
    write(root, LEARNER_FILE, "export const STEPS = ['c1']\n")
    sh('git commit -q -a -m "c1"')
    sh(`git tag ${String(LADDER_REFS[0])}`)
    write(root, LEARNER_FILE, "export const STEPS = ['c2']\n")
    sh('git commit -q -a -m "c2"')
    sh(`git tag ${String(LADDER_REFS[1])}`)
    sh(`git checkout -q -b bai ${LADDER_BASE}`)
    const runCommand: CliIo["runCommand"] = (command, cwd, _timeout, env) => {
        if (command.startsWith("git ")) return Promise.resolve(really(command, cwd))
        const ids = (env?.STARCI_CASES ?? "").split(",")
        write(
            cwd,
            "reports/junit.xml",
            reportXml(
                ids.map((id) =>
                    green.has(id)
                        ? { name: `[case:${id}] holds` }
                        : { name: `[case:${id}] [invariant:money-back] holds`, failure: "Expected: 5&#10;Received: 3" },
                ),
            ),
        )
        return Promise.resolve({ exitCode: 0, output: "", durationMs: 7 })
    }
    return { world, io: { ...world.io, runCommand }, root, green }
}

const gitOf = (root: string, args: string): string => really(`git ${args}`, root).output.trim()

describe("the case commands of a lab@2 lab", () => {
    it("runs a case with every case before it, prints where each stands and uploads one case.result", async () => {
        const lab = labOf()
        lab.green.add("checkout-in-stock").add("checkout-slow-net")

        expect(await caseRunCommand(lab.io, join(lab.root, "services", "orders"), "out-of-stock")).toBe(1)

        expect(lab.world.out.join("\n")).toContain("[đỏ]   khó  out-of-stock")
        expect(lab.world.out.join("\n")).toContain("bất biến hỏng: money-back")
        const upload = lab.world.sent.find((sent) => sent.query.includes("relayLabCaseResult"))
        expect(upload?.variables.input).toMatchObject({
            taskId: "course:shop-giay/saga-compensation",
            caseId: "out-of-stock",
            status: "red",
            upTo: [
                { caseId: "checkout-in-stock", status: "green" },
                { caseId: "checkout-slow-net", status: "green" },
                { caseId: "out-of-stock", status: "red" },
            ],
            chaos: [{ key: "STOCK_OUT", value: "on" }],
            failed: { invariant: "money-back", expected: "5", actual: "3" },
        })
        expect(readQueue(lab.io.env)).toEqual([])
    })

    it("shows a case's reference diff only once it is green", async () => {
        const lab = labOf()

        expect(await caseDiffCommand(lab.io, lab.root, "flaky-undo")).toBe(1)
        expect(lab.world.err.join("\n")).toContain("chỉ mở khi case này đã xanh")

        ;["checkout-in-stock", "checkout-slow-net", "out-of-stock", "flaky-undo"].forEach((id) => lab.green.add(id))
        await caseRunCommand(lab.io, lab.root, "flaky-undo")
        expect(await caseDiffCommand(lab.io, lab.root, "flaky-undo")).toBe(0)

        const shown = lab.world.out.join("\n")
        expect(shown).toContain("-export const STEPS = ['c1']")
        expect(shown).toContain("+export const STEPS = ['c2']")
        expect(await caseDiffCommand(lab.io, lab.root, "checkout-in-stock")).toBe(2)
    })

    it("resets to a rung: the learner's uncommitted work is kept on cua-toi-luu-<id>, the rung's file is committed on their branch", async () => {
        const lab = labOf()
        write(lab.root, LEARNER_FILE, "export const STEPS = ['mine']\n")

        expect(await caseResetToCommand(lab.io, lab.root, "out-of-stock")).toBe(0)

        expect(gitOf(lab.root, "symbolic-ref --short HEAD")).toBe("bai")
        expect(readFileSync(join(lab.root, LEARNER_FILE), "utf8")).toBe("export const STEPS = ['c1']\n")
        expect(gitOf(lab.root, `show cua-toi-luu-out-of-stock:${LEARNER_FILE}`)).toBe("export const STEPS = ['mine']")
        expect(gitOf(lab.root, "log -1 --format=%s")).toBe(`starci: ve bac tham chieu out-of-stock (${String(LADDER_REFS[0])})`)
        expect(gitOf(lab.root, "status --porcelain --untracked-files=no")).toBe("")
        const reset = lab.world.sent.find((sent) => sent.query.includes("relayLabCaseReset"))
        expect(reset?.variables.input).toMatchObject({ caseId: "out-of-stock", stashedBranch: "cua-toi-luu-out-of-stock" })

        // A second reset of the same case never overwrites the first save.
        expect(await caseResetToCommand(lab.io, lab.root, "out-of-stock")).toBe(0)
        expect(gitOf(lab.root, "branch --list cua-toi-luu-*")).toContain("cua-toi-luu-out-of-stock-2")
    })

    it("lists the cases, and refuses an unknown case and a rung the checkout does not have", async () => {
        const lab = labOf()

        expect(caseListCommand(lab.io, lab.root)).toBe(0)
        expect(lab.world.out.filter((line) => line.startsWith("[chưa]"))).toHaveLength(9)
        expect(await caseRunCommand(lab.io, lab.root, "nope")).toBe(2)
        expect(await caseResetToCommand(lab.io, lab.root, "refund-twice")).toBe(2)
        expect(lab.world.err.join("\n")).toContain(`Không thấy bậc ${String(LADDER_REFS[2])}`)
    })

    it("refuses outside a lab", async () => {
        const world = worldOf(undefined)

        expect(await caseRunCommand(world.io, mkdtempSync(join(tmpdir(), "starci-nolab-")), "x")).toBe(2)
        expect(world.err.join("\n")).toContain("Không thấy starci-lab.yaml")
    })
})
