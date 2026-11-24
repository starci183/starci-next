import { execSync } from "node:child_process"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import type { CheckRun, CliIo } from "./relay-client.contracts"
import { caseDiffCommand, caseListCommand, caseResetToCommand, caseRunCommand } from "./lab-case.cli"
import { LADDER_BASE, LADDER_REFS, LEARNER_FILE, manifestYaml, reportXml } from "./lab-manifest.testing"
import { worldOf, type World } from "./lesson.testing"
import { readQueue } from "./upload-queue.adapter"
import { RESET_TO_MUTATION, RUNG_QUERY } from "./lab-rung.client"
import { operationErrors } from "./core-schema.testing"

/** git with a fixed identity, so a commit works on a machine with no git config (CI). */
const GIT_ENV = {
    GIT_AUTHOR_NAME: "learner",
    GIT_AUTHOR_EMAIL: "learner@example.invalid",
    GIT_COMMITTER_NAME: "learner",
    GIT_COMMITTER_EMAIL: "learner@example.invalid",
}

const really = (command: string, cwd: string): CheckRun => {
    try {
        const output = execSync(command, {
            cwd,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
            env: { ...process.env, ...GIT_ENV },
        })
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

/** The learner file at each rung StarCi holds (the checkout holds only the base). */
const RUNG_TEXT: Readonly<Record<string, string>> = {
    [LADDER_BASE]: "export const STEPS = ['c0']\n",
    [String(LADDER_REFS[0])]: "export const STEPS = ['c1']\n",
    [String(LADDER_REFS[1])]: "export const STEPS = ['c2']\n",
}

/** The unhappy case each ladder ref fixes, in the fixture's order. */
const CASE_OF_REF = ["out-of-stock", "flaky-undo", "refund-twice"] as const

/** One GraphQL answer of the fake StarCi: data, or a refusal with its stable code. */
const answerOf = (data: Record<string, unknown> | null, code?: string): { status: number; text: string } => ({
    status: 200,
    text: JSON.stringify(
        code === undefined ? { data } : { data: null, errors: [{ message: code, extensions: { code } }] },
    ),
})

const rungField = (tag: string): Record<string, unknown> => {
    const content = RUNG_TEXT[tag] ?? ""
    return {
        kind: `rung:${tag}`,
        tag,
        path: LEARNER_FILE,
        content,
        sha256: createHash("sha256").update(content, "utf8").digest("hex"),
    }
}

/** What the fake StarCi saw: the cases it recorded green (from uploaded green runs) and the resets it recorded. */
interface Server {
    readonly green: Set<string>
    readonly resets: Array<Record<string, unknown>>
    online: boolean
}

/**
 * A lab checkout as a learner has it: the manifest and the learner file at c0 on the learner's branch `bai`, and NO ladder tags (the
 * source tarball holds the base rung alone). StarCi is faked: it holds the rungs, records a case green when a green `case.result`
 * arrives, serves a diff rung only for a case it recorded green, and records every reset before it hands the rung.
 */
const labOf = (): {
    readonly world: World
    readonly io: CliIo
    readonly root: string
    readonly green: Set<string>
    readonly server: Server
    readonly envs: Array<Readonly<Record<string, string>> | undefined>
} => {
    const world = worldOf(undefined)
    const root = mkdtempSync(join(tmpdir(), "starci-lab2-"))
    const green = new Set<string>()
    const server: Server = { green: new Set(), resets: [], online: true }
    const sh = (command: string): string => {
        const run = really(command, root)
        if (run.exitCode !== 0) throw new Error(`${command}: ${run.output}`)
        return run.output
    }
    write(root, "starci-lab.yaml", manifestYaml({ testCases: "node cases.js {ids}" }))
    write(root, ".gitignore", "reports/\n")
    write(root, LEARNER_FILE, String(RUNG_TEXT[LADDER_BASE]))
    sh("git init -q -b bai")
    sh("git add -A")
    sh('git commit -q -m "starci: bai saga-compensation"')
    const fetch: CliIo["fetch"] = (url, init) => {
        if (!server.online) return Promise.resolve({ status: 0, text: "" })
        const body = JSON.parse(init.body) as { query: string; variables: { input: Record<string, unknown> } }
        const input = body.variables.input
        if (body.query.includes("relayLabRung(")) {
            world.sent.push(body)
            const caseId = String(input.caseId)
            const index = CASE_OF_REF.indexOf(caseId as (typeof CASE_OF_REF)[number])
            const span =
                index === -1
                    ? []
                    : [index === 0 ? LADDER_BASE : String(LADDER_REFS[index - 1]), String(LADDER_REFS[index])]
            if (!span.includes(String(input.tag))) return Promise.resolve(answerOf(null, "COURSE_RUNG_NOT_FOUND"))
            if (!server.green.has(caseId)) return Promise.resolve(answerOf(null, "COURSE_RUNG_LOCKED"))
            return Promise.resolve(answerOf({ relayLabRung: rungField(String(input.tag)) }))
        }
        if (body.query.includes("relayLabCaseResetTo(")) {
            world.sent.push(body)
            const tag = String(LADDER_REFS[CASE_OF_REF.indexOf(String(input.caseId) as (typeof CASE_OF_REF)[number])])
            if (RUNG_TEXT[tag] === undefined) return Promise.resolve(answerOf(null, "COURSE_RUNG_NOT_FOUND"))
            server.resets.push(input)
            return Promise.resolve(answerOf({ relayLabCaseResetTo: rungField(tag) }))
        }
        if (body.query.includes("relayLabCaseResult(") && input.status === "green")
            server.green.add(String(input.caseId))
        return world.io.fetch(url, init)
    }
    const envs: Array<Readonly<Record<string, string>> | undefined> = []
    const runCommand: CliIo["runCommand"] = (command, cwd, _timeout, env) => {
        if (command.startsWith("git ")) return Promise.resolve(really(command, cwd))
        envs.push(env)
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
    return { world, io: { ...world.io, fetch, runCommand }, root, green, server, envs }
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
        // The lab's own `docker compose` must reach the stack the boot started under the server's project name.
        expect(lab.envs[0]).toMatchObject({ COMPOSE_PROJECT_NAME: "starci-shop-giay-saga-compensation" })
    })

    it("shows a case's reference diff, fetched from StarCi, only once StarCi recorded the case green", async () => {
        const lab = labOf()

        expect(await caseDiffCommand(lab.io, lab.root, "flaky-undo")).toBe(1)
        expect(lab.world.err.join("\n")).toContain("chỉ mở khi case này đã xanh")

        ;["checkout-in-stock", "checkout-slow-net", "out-of-stock", "flaky-undo"].forEach((id) => lab.green.add(id))
        await caseRunCommand(lab.io, lab.root, "flaky-undo")
        expect(await caseDiffCommand(lab.io, lab.root, "flaky-undo")).toBe(0)

        const shown = lab.world.out.join("\n")
        expect(shown).toContain("-export const STEPS = ['c1']")
        expect(shown).toContain("+export const STEPS = ['c2']")
        // the rungs never land in the checkout: the diff is made in a scratch folder
        expect(gitOf(lab.root, "status --porcelain")).toBe("")
        expect(await caseDiffCommand(lab.io, lab.root, "checkout-in-stock")).toBe(2)
    })

    it("does not open the diff on a local green StarCi never recorded (the run stayed queued offline)", async () => {
        const lab = labOf()
        ;["checkout-in-stock", "checkout-slow-net", "out-of-stock"].forEach((id) => lab.green.add(id))
        lab.server.online = false
        await caseRunCommand(lab.io, lab.root, "out-of-stock")
        expect(readQueue(lab.io.env)).toHaveLength(1)

        expect(await caseDiffCommand(lab.io, lab.root, "out-of-stock")).toBe(1)
        expect(lab.world.err.join("\n")).toContain("Không kết nối được StarCi")
        expect(lab.server.green.size).toBe(0)

        // Back online, the queued green run reaches StarCi first, and the diff opens.
        lab.server.online = true
        expect(await caseDiffCommand(lab.io, lab.root, "out-of-stock")).toBe(0)
        expect(readQueue(lab.io.env)).toEqual([])
        expect(lab.world.out.join("\n")).toContain("+export const STEPS = ['c1']")
    })

    it("says the diff is locked when StarCi has no green record of the case", async () => {
        const lab = labOf()
        ;["checkout-in-stock", "checkout-slow-net", "out-of-stock"].forEach((id) => lab.green.add(id))
        // the learner's report says green, but no run ever reached StarCi
        await caseRunCommand(lab.io, lab.root, "out-of-stock")
        lab.server.green.clear()

        expect(await caseDiffCommand(lab.io, lab.root, "out-of-stock")).toBe(1)
        expect(lab.world.err.join("\n")).toContain("StarCi chưa ghi nhận out-of-stock xanh")
    })

    it("resets to a rung: the learner's uncommitted work is kept on cua-toi-luu-<id>, StarCi records it and hands the rung, committed on their branch", async () => {
        const lab = labOf()
        write(lab.root, LEARNER_FILE, "export const STEPS = ['mine']\n")

        expect(await caseResetToCommand(lab.io, lab.root, "out-of-stock")).toBe(0)

        expect(gitOf(lab.root, "symbolic-ref --short HEAD")).toBe("bai")
        expect(readFileSync(join(lab.root, LEARNER_FILE), "utf8").replaceAll("\r\n", "\n")).toBe(
            "export const STEPS = ['c1']\n",
        )
        expect(gitOf(lab.root, `show cua-toi-luu-out-of-stock:${LEARNER_FILE}`)).toBe("export const STEPS = ['mine']")
        expect(gitOf(lab.root, "log -1 --format=%s")).toBe(
            `starci: ve bac tham chieu out-of-stock (${String(LADDER_REFS[0])})`,
        )
        expect(gitOf(lab.root, "status --porcelain --untracked-files=no")).toBe("")
        expect(lab.server.resets).toHaveLength(1)
        expect(lab.server.resets[0]).toMatchObject({
            taskId: "course:shop-giay/saga-compensation",
            lessonId: "saga-compensation",
            caseId: "out-of-stock",
            stashedBranch: "cua-toi-luu-out-of-stock",
        })
        // the reset is recorded by the door itself, never queued as a second event
        expect(lab.world.sent.filter((sent) => sent.query.includes("relayLabCaseReset("))).toHaveLength(0)

        // A second reset of the same case never overwrites the first save.
        expect(await caseResetToCommand(lab.io, lab.root, "out-of-stock")).toBe(0)
        expect(gitOf(lab.root, "branch --list cua-toi-luu-*")).toContain("cua-toi-luu-out-of-stock-2")
    })

    it("resets a case never green: the reset is always allowed", async () => {
        const lab = labOf()

        expect(await caseResetToCommand(lab.io, lab.root, "flaky-undo")).toBe(0)

        expect(readFileSync(join(lab.root, LEARNER_FILE), "utf8").replaceAll("\r\n", "\n")).toBe(
            "export const STEPS = ['c2']\n",
        )
    })

    it("moves nothing when StarCi cannot be reached: the learner's edit stays in place and no branch is made", async () => {
        const lab = labOf()
        write(lab.root, LEARNER_FILE, "export const STEPS = ['mine']\n")
        lab.server.online = false

        expect(await caseResetToCommand(lab.io, lab.root, "out-of-stock")).toBe(1)

        expect(readFileSync(join(lab.root, LEARNER_FILE), "utf8")).toBe("export const STEPS = ['mine']\n")
        expect(gitOf(lab.root, "branch --list cua-toi-luu-*")).toBe("")
        expect(lab.world.err.join("\n")).toContain("repo giữ nguyên")
        expect(lab.server.resets).toHaveLength(0)
    })

    it("lists the cases, and refuses an unknown case and a rung StarCi does not have", async () => {
        const lab = labOf()

        expect(caseListCommand(lab.io, lab.root)).toBe(0)
        expect(lab.world.out.filter((line) => line.startsWith("[chưa]"))).toHaveLength(9)
        expect(await caseRunCommand(lab.io, lab.root, "nope")).toBe(2)
        expect(await caseResetToCommand(lab.io, lab.root, "refund-twice")).toBe(1)
        expect(lab.world.err.join("\n")).toContain("COURSE_RUNG_NOT_FOUND")
    })

    it("asks StarCi with operations its schema snapshot accepts", () => {
        expect(operationErrors(RUNG_QUERY)).toEqual([])
        expect(operationErrors(RESET_TO_MUTATION)).toEqual([])
    })

    it("refuses outside a lab", async () => {
        const world = worldOf(undefined)

        expect(await caseRunCommand(world.io, mkdtempSync(join(tmpdir(), "starci-nolab-")), "x")).toBe(2)
        expect(world.err.join("\n")).toContain("Không thấy starci-lab.yaml")
    })
})
