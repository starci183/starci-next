import { generateKeyPairSync, sign } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { listenCommand } from "./listen.cli"
import { runLab, WATCH_DEBOUNCE_MS } from "./lab.cli"
import { readChaosOn, readTreeText, writeChaosOn, writeDeviceKey } from "./lab-files.adapter"
import { readBootedFolder, writeLabFolder } from "./lab-workspace.adapter"
import { gradeTextOf, newDeviceKey, signatureHolds } from "./lab-sign.policy"
import { labOf } from "./lab.policy"
import {
    REPORT_GRADE,
    REPORT_LAB,
    SEED_ORDER,
    SOURCE_COMMIT,
    bugsTarball,
    exists,
    gradeBody,
    labBody,
    labWorld,
    solutionLink,
    solutionTarball,
    textOf,
    type Answer,
    type LabWorld,
} from "./lab.testing"
import type { LabSection } from "./lab.contracts"
import { inputErrors, operationErrors } from "./core-schema.testing"
import { uploadMutationOf } from "./relay-graphql.client"
import type { DeviceHandlers, UploadMutation } from "./relay-client.contracts"
import { KEYS } from "./lesson.testing"

const labOfBody = (extra: Record<string, unknown> = {}): LabSection => labOf(labBody(extra)) as LabSection

/** A runner that passes everything and writes the lab report for the test command. */
const passing = (command: string): Answer => (command === "npm test" ? { report: REPORT_LAB } : undefined)

/** A runner that also writes the grading report for the grading command. */
const grading = (command: string): Answer => {
    if (command === "npm run grade") return { report: REPORT_GRADE }
    return passing(command)
}

const run = (machine: LabWorld, lab: LabSection): Promise<number> =>
    runLab(machine.io, machine.session, machine.state, lab)

const bootsOf = (machine: LabWorld): Array<[string, string]> =>
    machine
        .uploads()
        .filter((upload) => upload.mutation === "relayLabBoot")
        .map((upload) => [String(upload.input.stage), String(upload.input.status)])

const commandsOf = (machine: LabWorld): Array<string> => machine.ran.map((ran) => ran.command)

describe("labOf learnerDir", () => {
    it("keeps the signed learnerDir as text and leaves it out when the manifest has none", () => {
        expect(labOfBody({ learnerDir: "~/work/saga" }).learnerDir).toBe("~/work/saga")
        expect(labOfBody()).not.toHaveProperty("learnerDir")
    })

    it("rejects a learnerDir that is not text, but passes an unsafe text on to be refused aloud", () => {
        expect(labOf(labBody({ learnerDir: 7 }))).toBeNull()
        expect(labOfBody({ learnerDir: "/" }).learnerDir).toBe("/")
    })
})

describe("runLab learnerDir", () => {
    it("refuses an unsafe learnerDir without touching the disk when a boot runs outside listen", async () => {
        const machine = labWorld(passing)

        expect(await run(machine, labOfBody({ learnerDir: "relative" }))).toBe(1)

        expect(machine.world.err.join("\n")).toContain("Not using the folder StarCi sent")
        expect(machine.ran).toHaveLength(0)
        expect(exists(machine.root)).toBe(false)
    })
})

describe("runLab boot", () => {
    it("fetches the tarball with the device token, unpacks it into ~/starci/<course>/<lesson>, commits the baseline, then composes, runs the first tests and reports every stage", async () => {
        const machine = labWorld(passing)

        expect(await run(machine, labOfBody())).toBe(0)

        expect(machine.downloads).toEqual([
            { url: "https://app.test/api/relay/courses/backend/orders/bugs.tgz", bearer: "t".repeat(43) },
        ])
        expect(textOf(join(machine.work, "src", "orders.ts"))).toBe("export const orders = 'buggy'\n")
        expect(machine.git("log --format=%s")).toBe(`starci: bai orders @ ${SOURCE_COMMIT.slice(0, 12)}\n`)
        expect(machine.git("rev-list --count HEAD").trim()).toBe("1")
        expect(machine.git("status --porcelain").trim()).toBe("")
        expect(bootsOf(machine)).toEqual([
            ["machine", "running"],
            ["machine", "done"],
            ["clone", "running"],
            ["clone", "done"],
            ["compose", "running"],
            ["compose", "done"],
            ["seed", "running"],
            ["seed", "done"],
            ["first-run", "running"],
            ["first-run", "done"],
        ])
        const compose = machine.ran.find((ran) => ran.command.startsWith("docker compose"))
        expect(compose).toMatchObject({
            command: "docker compose -p backend-orders -f docker-compose.yml up -d --build",
            cwd: machine.work,
        })
        expect(machine.ran.find((ran) => ran.command === "npm test")?.cwd).toBe(machine.work)
        expect(machine.world.out.join("\n")).toContain("seed: none")
    })

    it("runs the seed command of the manifest in the project folder when it names one", async () => {
        const machine = labWorld(passing)

        expect(await run(machine, labOfBody({ seed: { command: "npm run seed", timeoutMs: 60_000 } }))).toBe(0)

        expect(machine.ran.find((ran) => ran.command === "npm run seed")?.cwd).toBe(machine.work)
        const order = commandsOf(machine)
        expect(order.indexOf("npm run seed")).toBeGreaterThan(
            order.findIndex((command) => command.startsWith("docker compose")),
        )
        expect(order.indexOf("npm run seed")).toBeLessThan(order.indexOf("npm test"))
        expect(machine.world.out.join("\n")).toContain("seed: npm run seed")
    })

    it("reports the seed stage done with no seed when the manifest names none", async () => {
        const machine = labWorld(passing)

        await run(machine, labOfBody())

        const seed = machine.uploads().filter((upload) => upload.input.stage === "seed")
        expect(seed.map((upload) => [upload.input.status, upload.input.detail])).toEqual([
            ["running", ""],
            ["done", "no seed"],
        ])
    })

    it("uploads lab.tests, lab.files and a log per service after the first run, each carrying the run id, on the learner's own commit", async () => {
        const machine = labWorld(passing)

        await run(machine, labOfBody({ chaosOn: ["drop-queue"] }))

        const uploads = machine.uploads()
        const head = machine.git("rev-parse HEAD").trim()
        const tests = uploads.find((upload) => upload.mutation === "relayLabTests")?.input
        expect(tests).toMatchObject({
            taskId: "course:backend/orders",
            commit: head,
            chaosOn: ["drop-queue"],
            tests: [
                { id: "orders-once", passed: true },
                { id: "stock-never-goes-negative", passed: false, message: "stock was -1" },
            ],
        })
        const files = uploads.find((upload) => upload.mutation === "relayLabFiles")?.input
        expect(files?.commit).toBe(head)
        expect((files?.files as Array<{ path: string; text: string }>).map((file) => file.path)).toEqual([
            "src/orders.ts",
            "src/stock.ts",
        ])
        const logs = uploads.filter((upload) => upload.mutation === "relayLog")
        expect(logs.map((log) => log.input.checkId)).toEqual(["api", "db"])
        expect(commandsOf(machine)).toContain(
            "docker compose -p backend-orders -f docker-compose.yml logs --no-color --tail 400 api",
        )
        const order = uploads.map((upload) => upload.mutation)
        expect(order.indexOf("relayLabTests")).toBeLessThan(order.indexOf("relayLabFiles"))
        expect(order.indexOf("relayLabFiles")).toBeLessThan(order.indexOf("relayLog"))
        expect(new Set(uploads.map((upload) => upload.input.eventId)).size).toBe(uploads.length)
        uploads.forEach((upload) => expect(typeof upload.input.runId).toBe("string"))
    })

    it("turns on the chaos that is on in the fresh stack after the seed and before the first tests, and writes it down", async () => {
        const machine = labWorld(passing)

        expect(await run(machine, labOfBody({ chaosOn: ["slow-db"] }))).toBe(0)

        const order = commandsOf(machine)
        expect(order).toContain("node chaos.js slow-db on")
        expect(order.indexOf("node chaos.js slow-db on")).toBeLessThan(order.indexOf("npm test"))
        expect(machine.ran.find((ran) => ran.command === "node chaos.js slow-db on")?.cwd).toBe(machine.work)
        expect(readChaosOn(machine.root)).toEqual(["slow-db"])
    })

    it("fails the first run when a chaos command fails, and runs no test", async () => {
        const machine = labWorld((command) =>
            command === "node chaos.js slow-db on" ? { exitCode: 3 } : passing(command),
        )

        expect(await run(machine, labOfBody({ chaosOn: ["slow-db"] }))).toBe(1)

        expect(bootsOf(machine).at(-1)).toEqual(["first-run", "failed"])
        expect(commandsOf(machine)).not.toContain("npm test")
        expect(readChaosOn(machine.root)).toEqual([])
    })

    it("refuses a tarball whose hash is not the signed one: nothing is unpacked, composed or run", async () => {
        const machine = labWorld(passing, undefined, () => ({ status: 200, bytes: Buffer.from("not the tarball") }))

        expect(await run(machine, labOfBody())).toBe(1)

        expect(machine.world.err.join("\n")).toContain("does not match the sha256")
        expect(bootsOf(machine).at(-1)).toEqual(["clone", "failed"])
        expect(exists(machine.root)).toBe(false)
        expect(commandsOf(machine)).toEqual(["docker info"])
    })

    it("fails the source stage when StarCi refuses the tarball", async () => {
        const machine = labWorld(passing, undefined, () => ({ status: 403, bytes: Buffer.alloc(0) }))

        expect(await run(machine, labOfBody())).toBe(1)

        expect(machine.world.err.join("\n")).toContain("HTTP 403")
        expect(bootsOf(machine).at(-1)).toEqual(["clone", "failed"])
        expect(exists(machine.root)).toBe(false)
    })

    it("keeps a lab folder that is already there: nothing is downloaded and the learner's files stay as they are", async () => {
        const machine = labWorld(passing)
        await run(machine, labOfBody())
        writeFileSync(join(machine.work, "src", "orders.ts"), "export const orders = 'mine'\n")
        machine.git("commit -am mine")
        writeFileSync(join(machine.work, "notes.txt"), "learner notes\n")
        machine.downloads.length = 0
        machine.ran.length = 0

        expect(await run(machine, labOfBody())).toBe(0)

        expect(machine.downloads).toEqual([])
        expect(textOf(join(machine.work, "src", "orders.ts"))).toBe("export const orders = 'mine'\n")
        expect(textOf(join(machine.work, "notes.txt"))).toBe("learner notes\n")
        expect(commandsOf(machine).some((command) => command.startsWith("tar") || command.startsWith("git init"))).toBe(
            false,
        )
        expect(machine.git("rev-list --count HEAD").trim()).toBe("2")
        const clone = machine
            .uploads()
            .filter((upload) => upload.input.stage === "clone" && upload.input.status === "done")
        expect(String(clone.at(-1)?.input.detail)).toContain("kept")
        expect(machine.world.out.join("\n")).toContain("không bị ghi đè")
        expect(machine.world.out.join("\n")).toContain("not overwritten")
    })

    it("unpacks onto a folder that exists but is empty, and refuses a folder that holds other files", async () => {
        const empty = labWorld(passing)
        mkdirSync(empty.root, { recursive: true })
        expect(await run(empty, labOfBody())).toBe(0)
        expect(exists(join(empty.work, "src", "orders.ts"))).toBe(true)

        const other = labWorld(passing)
        mkdirSync(other.root, { recursive: true })
        writeFileSync(join(other.root, "mine.txt"), "mine")
        expect(await run(other, labOfBody())).toBe(1)
        expect(other.downloads).toEqual([])
        expect(textOf(join(other.root, "mine.txt"))).toBe("mine")
        expect(other.world.err.join("\n")).toContain("không phải thư mục lab")
        expect(other.world.err.join("\n")).toContain("not a StarCi lab folder")
        expect(bootsOf(other).at(-1)).toEqual(["clone", "failed"])
    })

    it("unpacks the solution beside the lab when the manifest carries it, and leaves an existing solution folder alone", async () => {
        const machine = labWorld(passing)

        expect(await run(machine, labOfBody({ solution: solutionLink() }))).toBe(0)

        expect(machine.downloads.map((download) => download.url)).toEqual([
            "https://app.test/api/relay/courses/backend/orders/bugs.tgz",
            "https://app.test/api/relay/courses/backend/orders/solution.tgz",
        ])
        expect(textOf(join(`${machine.root}-solution`, "app", "src", "orders.ts"))).toBe(
            "export const orders = 'fixed'\n",
        )
        expect(solutionTarball().sha256).not.toBe(bugsTarball().sha256)

        machine.downloads.length = 0
        await run(machine, labOfBody({ solution: solutionLink() }))
        expect(machine.downloads).toEqual([])
    })

    it("still boots when the solution cannot be fetched", async () => {
        const machine = labWorld(passing, undefined, (url) =>
            url.endsWith("solution.tgz")
                ? { status: 403, bytes: Buffer.alloc(0) }
                : { status: 200, bytes: bugsTarball().bytes },
        )

        expect(await run(machine, labOfBody({ solution: solutionLink() }))).toBe(0)

        expect(bootsOf(machine).at(-1)).toEqual(["first-run", "done"])
        expect(exists(`${machine.root}-solution`)).toBe(false)
    })

    it("stops at the first failed stage, reports it failed and starts no watcher", async () => {
        const machine = labWorld((command) => (command === "docker info" ? { exitCode: 1 } : undefined))

        expect(await run(machine, labOfBody())).toBe(1)

        expect(bootsOf(machine)).toEqual([
            ["machine", "running"],
            ["machine", "failed"],
        ])
        const failed = machine.uploads().find((upload) => upload.input.status === "failed")?.input
        expect(String(failed?.detail)).toContain("Docker is not running")
        expect(commandsOf(machine)).toEqual(["docker info"])
        expect(machine.downloads).toEqual([])
    })

    it("fails the machine stage on too little memory, and never sends more than 300 characters of detail", async () => {
        const machine = labWorld(passing, 100)

        await run(machine, labOfBody())

        const failed = machine.uploads().find((upload) => upload.input.status === "failed")?.input
        expect(String(failed?.detail)).toContain("memory")
        expect(String(failed?.detail).length).toBeLessThanOrEqual(300)
    })

    it("fails the first run when the test command wrote no report, and the stage detail never carries command output", async () => {
        const machine = labWorld((command) =>
            command === "npm test" ? { exitCode: 1, output: "SECRET_TOKEN=abc" } : undefined,
        )

        expect(await run(machine, labOfBody())).toBe(1)

        const last = machine
            .uploads()
            .filter((upload) => upload.mutation === "relayLabBoot")
            .at(-1)?.input
        expect(last).toMatchObject({ stage: "first-run", status: "failed" })
        expect(JSON.stringify(machine.uploads())).not.toContain("SECRET_TOKEN")
    })

    it("keeps the test report out of the learner's git status, so a committed run never makes the tree dirty", async () => {
        const machine = labWorld(passing)
        await run(machine, labOfBody())

        expect(exists(join(machine.work, "reports", "junit.xml"))).toBe(true)
        expect(machine.git("status --porcelain").trim()).toBe("")
        expect(machine.git("add -A")).toBe("")
        expect(machine.git("status --porcelain").trim()).toBe("")
    })
})

describe("runLab watch", () => {
    it("uploads a changed file once after the debounce, with its text and sha256, and stops on a new boot", async () => {
        const machine = labWorld(passing)
        await run(machine, labOfBody())
        const before = machine.uploads().filter((upload) => upload.mutation === "relayLabFiles").length

        machine.host.trigger("src/orders.ts")
        machine.host.trigger("src/orders.ts")
        await new Promise((resolve) => setTimeout(resolve, 0))
        await machine.state.sending

        const files = machine.uploads().filter((upload) => upload.mutation === "relayLabFiles")
        expect(files).toHaveLength(before + 1)
        expect(files.at(-1)?.input.files).toEqual([
            expect.objectContaining({ path: "src/orders.ts", text: "export const orders = 'buggy'\n" }),
        ])
        expect(files.at(-1)?.input).toMatchObject({ taskId: "course:backend/orders", runId: expect.any(String) })
        expect(WATCH_DEBOUNCE_MS).toBe(400)
        expect(machine.host.closed()).toBe(false)

        await run(machine, labOfBody({ files: [] }))
        expect(machine.host.closed()).toBe(true)
    })

    it("uploads only the changed file, which the relay merges into the others it holds", async () => {
        const machine = labWorld(passing)
        await run(machine, labOfBody())

        machine.host.trigger("src/stock.ts")
        await new Promise((resolve) => setTimeout(resolve, 0))
        await machine.state.sending

        const last = machine
            .uploads()
            .filter((upload) => upload.mutation === "relayLabFiles")
            .at(-1)?.input
        expect((last?.files as Array<{ path: string }>).map((file) => file.path)).toEqual(["src/stock.ts"])
    })

    it("never uploads a path the lab does not list", async () => {
        const machine = labWorld(passing)
        await run(machine, labOfBody())
        const before = machine.uploads().length

        machine.host.trigger("src/secret.ts")
        await new Promise((resolve) => setTimeout(resolve, 0))
        await machine.state.sending

        expect(machine.uploads()).toHaveLength(before)
    })
})

describe("runLab test and chaos", () => {
    it("test runs the tests in the project folder with no chaos command, uploads lab.tests and the logs, and wants a boot first", async () => {
        const machine = labWorld(passing)
        expect(await run(machine, labOfBody({ action: "test" }))).toBe(1)
        expect(machine.world.err.join("\n")).toContain("Boot the lab first")
        expect(machine.world.err.join("\n")).toContain("khởi động lab trước")

        await run(machine, labOfBody())
        machine.ran.length = 0
        const before = machine.uploads().length

        expect(await run(machine, labOfBody({ action: "test", chaosOn: ["drop-queue"] }))).toBe(0)

        expect(machine.ran.find((ran) => ran.command === "npm test")).toMatchObject({ cwd: machine.work })
        expect(commandsOf(machine).some((command) => command.startsWith("node chaos.js"))).toBe(false)
        expect(
            machine
                .uploads()
                .slice(before)
                .map((upload) => upload.mutation),
        ).toEqual(["relayLabTests", "relayLog", "relayLog"])
    })

    it("chaos runs off for the switches leaving chaosOn and on for the ones entering it, in the project folder, then the tests, with no compose up", async () => {
        const machine = labWorld(passing)
        await run(machine, labOfBody({ chaosOn: ["slow-db"] }))
        machine.ran.length = 0

        expect(await run(machine, labOfBody({ action: "chaos", chaosOn: ["drop-queue"] }))).toBe(0)

        const commands = commandsOf(machine)
        expect(commands.slice(0, 2)).toEqual(["node chaos.js slow-db off", "node chaos.js drop-queue on"])
        expect(machine.ran[0]).toMatchObject({ cwd: machine.work })
        expect(commands.indexOf("npm test")).toBe(2)
        expect(commands.some((command) => command.includes("up -d"))).toBe(false)
        expect(readChaosOn(machine.root)).toEqual(["drop-queue"])
        const tests = machine
            .uploads()
            .filter((upload) => upload.mutation === "relayLabTests")
            .at(-1)?.input
        expect(tests?.chaosOn).toEqual(["drop-queue"])
    })

    it("chaos with nothing changed runs no chaos command and still runs the tests", async () => {
        const machine = labWorld(passing)
        await run(machine, labOfBody({ chaosOn: ["slow-db"] }))
        machine.ran.length = 0

        expect(await run(machine, labOfBody({ action: "chaos", chaosOn: ["slow-db"] }))).toBe(0)

        expect(commandsOf(machine)[0]).toBe("npm test")
    })

    it("chaos turns every switch off when chaosOn is empty", async () => {
        const machine = labWorld(passing)
        await run(machine, labOfBody({ chaosOn: ["slow-db", "drop-queue"] }))
        machine.ran.length = 0

        expect(await run(machine, labOfBody({ action: "chaos", chaosOn: [] }))).toBe(0)

        expect(commandsOf(machine).slice(0, 2)).toEqual(["node chaos.js slow-db off", "node chaos.js drop-queue off"])
        expect(readChaosOn(machine.root)).toEqual([])
    })

    it("chaos stops at the first command that fails, keeps a true record of what is on and runs no tests", async () => {
        const machine = labWorld((command) =>
            command === "node chaos.js drop-queue on" ? { exitCode: 1 } : passing(command),
        )
        await run(machine, labOfBody())
        machine.ran.length = 0
        const before = machine.uploads().length

        expect(await run(machine, labOfBody({ action: "chaos", chaosOn: ["slow-db", "drop-queue"] }))).toBe(1)

        expect(commandsOf(machine)).toEqual(["node chaos.js slow-db on", "node chaos.js drop-queue on"])
        expect(readChaosOn(machine.root)).toEqual(["slow-db"])
        expect(machine.uploads()).toHaveLength(before)
    })

    it("reads a chaos record that is missing or unreadable as nothing on", () => {
        const machine = labWorld(passing)
        mkdirSync(join(machine.root, ".git"), { recursive: true })

        expect(readChaosOn(machine.root)).toEqual([])
        writeFileSync(join(machine.root, ".git", "starci-chaos.json"), "not json")
        expect(readChaosOn(machine.root)).toEqual([])
        writeChaosOn(machine.root, ["slow-db"])
        expect(readChaosOn(machine.root)).toEqual(["slow-db"])
    })
})

/** The failure a machine's grade upload signed, or undefined when it sent none. */
const failureOf = (machine: LabWorld): unknown =>
    machine.uploads().find((upload) => upload.mutation === "relayLabGrade")?.input.failure

describe("runLab grade", () => {
    const gradeLab = (content?: string, sha256?: string): LabSection =>
        labOfBody({ action: "grade", grade: gradeBody(content, sha256) })

    /** A booted lab with the device key of this machine: a real repository with the baseline commit. */
    const booted = async (
        answer: (command: string, cwd: string) => Answer = grading,
    ): Promise<{ machine: LabWorld; publicKey: string }> => {
        const machine = labWorld(answer)
        await run(machine, labOfBody())
        const key = newDeviceKey()
        writeDeviceKey(machine.world.io.env, key.privatePem)
        machine.ran.length = 0
        return { machine, publicKey: key.publicKey }
    }

    it("grades a clean checkout of the learner's HEAD with the hidden files and the seed order, deletes them and the worktree, and uploads a signature that holds", async () => {
        let seen: { hidden: boolean; cwd: string; source: string } | undefined
        const { machine, publicKey } = await booted((command, cwd) => {
            if (command !== "npm run grade") return passing(command)
            seen = {
                hidden: exists(join(cwd, "grader", "orders.hidden.test.ts")),
                cwd,
                source: textOf(join(cwd, "src", "orders.ts")).replaceAll("\r\n", "\n"),
            }
            return { report: REPORT_GRADE }
        })
        writeFileSync(join(machine.work, "src", "orders.ts"), "export const orders = 'committed'\n")
        machine.git("commit -am work")
        const head = machine.git("rev-parse HEAD").trim()

        expect(await run(machine, gradeLab())).toBe(0)

        expect(seen?.hidden).toBe(true)
        expect(seen?.source).toBe("export const orders = 'committed'\n")
        expect(seen?.cwd).not.toBe(machine.work)
        expect(seen?.cwd.endsWith(join("checkout", "app"))).toBe(true)
        const graded = machine.ran.find((ran) => ran.command === "npm run grade")
        // The compose project name rides with every lab command, so the lab's own `docker compose` reaches the booted stack.
        expect(graded?.env).toEqual({ COMPOSE_PROJECT_NAME: "backend-orders", STARCI_SEED_ORDER: SEED_ORDER.join(",") })
        const commands = commandsOf(machine)
        expect(commands).toContainEqual(
            expect.stringMatching(new RegExp(`^git worktree add --detach ".+" ${head}$`, "u")),
        )
        expect(commands).toContainEqual(expect.stringMatching(/^git worktree remove --force ".+"$/u))
        expect(commands).toContain("git worktree prune")
        expect(exists(seen?.cwd ?? "")).toBe(false)
        expect(readTreeText(machine.work, "grader/orders.hidden.test.ts")).toBeNull()
        expect(machine.git("worktree list").trim().split("\n")).toHaveLength(1)

        const grade = machine.uploads().find((upload) => upload.mutation === "relayLabGrade")?.input
        expect(grade).toMatchObject({
            taskId: "course:backend/orders",
            runId: expect.any(String),
            submissionId: "sub-1",
            nonce: "nonce-1",
            commit: head,
        })
        const tests = grade?.tests as Array<{ id: string; name: string; passed: boolean; message: string }>
        expect(tests.map((item) => [item.id, item.passed])).toEqual([
            ["h-pay-once", true],
            ["h-order-total", true],
            ["h-stock", false],
        ])
        expect(tests.every((item) => item.name === item.id)).toBe(true)
        const text = gradeTextOf({ submissionId: "sub-1", nonce: "nonce-1", commit: head, tests: tests as never })
        expect(signatureHolds(publicKey, text, String(grade?.signature))).toBe(true)
    })

    it("refuses while a tracked file has an uncommitted change: it tells the learner to commit first in both languages and checks out nothing", async () => {
        const { machine } = await booted()
        writeFileSync(join(machine.work, "src", "orders.ts"), "export const orders = 'edited'\n")

        expect(await run(machine, gradeLab())).toBe(1)

        const err = machine.world.err.join("\n")
        expect(err).toContain("Hãy commit trước")
        expect(err).toContain("Commit first")
        expect(commandsOf(machine).some((command) => command.startsWith("git worktree"))).toBe(false)
        expect(commandsOf(machine)).not.toContain("npm run grade")
        expect(failureOf(machine)).toBe("uncommitted")

        machine.git("commit -am edited")
        machine.world.err.length = 0
        expect(await run(machine, gradeLab())).toBe(0)
    })

    it("does not count an untracked file as a change, so notes and logs never block a grade", async () => {
        const { machine } = await booted()
        writeFileSync(join(machine.work, "notes.txt"), "just notes\n")

        expect(await run(machine, gradeLab())).toBe(0)

        expect(machine.uploads().some((upload) => upload.mutation === "relayLabGrade")).toBe(true)
    })

    it("takes the commit from git rev-parse HEAD of the learner's folder and says when it has none", async () => {
        const { machine } = await booted((command) =>
            command === "git rev-parse HEAD" ? { exitCode: 128 } : grading(command),
        )

        expect(await run(machine, gradeLab())).toBe(1)

        expect(machine.world.err.join("\n")).toContain("no commit to grade")
        expect(machine.uploads().some((upload) => upload.mutation === "relayLabGrade")).toBe(false)
    })

    it("never uploads the hidden file's content, its path or a service log", async () => {
        const { machine } = await booted()
        const before = machine.uploads().length

        await run(machine, gradeLab("SECRET HIDDEN SOURCE"))

        const sent = JSON.stringify(machine.uploads().slice(before))
        expect(sent).not.toContain("SECRET HIDDEN SOURCE")
        expect(sent).not.toContain(Buffer.from("SECRET HIDDEN SOURCE").toString("base64"))
        expect(sent).not.toContain("orders.hidden.test.ts")
        expect(
            machine
                .uploads()
                .slice(before)
                .map((upload) => upload.mutation),
        ).toEqual(["relayLabGrade"])
    })

    it("names every hidden id exactly once, failing one the report did not mention", async () => {
        const { machine } = await booted((command) =>
            command === "npm run grade"
                ? { report: `<testsuites><testcase name="[scenario:h-order-total] totals" time="0.1"/></testsuites>` }
                : passing(command),
        )

        expect(await run(machine, gradeLab())).toBe(0)

        const grade = machine.uploads().find((upload) => upload.mutation === "relayLabGrade")?.input
        const tests = grade?.tests as Array<{ id: string; passed: boolean }>
        expect(tests.map((item) => item.id)).toEqual(SEED_ORDER)
        expect(tests.map((item) => item.passed)).toEqual([false, true, false])
    })

    it("refuses a hidden file whose hash is wrong before it makes any checkout", async () => {
        const { machine } = await booted()

        expect(await run(machine, gradeLab("content", "0".repeat(64)))).toBe(1)

        expect(machine.world.err.join("\n")).toContain("does not match its hash")
        expect(commandsOf(machine).some((command) => command.startsWith("git worktree"))).toBe(false)
        expect(failureOf(machine)).toBe("run-failed")
    })

    it("grades nothing without a device key", async () => {
        const machine = labWorld(grading)
        await run(machine, labOfBody())
        machine.ran.length = 0

        expect(await run(machine, gradeLab())).toBe(1)

        expect(machine.world.err.join("\n")).toContain("no device key")
        expect(machine.ran).toHaveLength(0)
    })

    it("cleans up and ends the submission with a signed no-readable-report when the grading run writes no report", async () => {
        const { machine } = await booted((command) => (command === "npm run grade" ? undefined : passing(command)))

        expect(await run(machine, gradeLab())).toBe(1)

        const worktree =
            /worktree add --detach "([^"]+)"/u.exec(
                commandsOf(machine).find((c) => c.startsWith("git worktree add")) ?? "",
            )?.[1] ?? ""
        expect(worktree).not.toBe("")
        expect(exists(worktree)).toBe(false)
        expect(commandsOf(machine)).toContainEqual(expect.stringMatching(/^git worktree remove --force/u))
        expect(failureOf(machine)).toBe("no-readable-report")
        expect(machine.git("worktree list").trim().split("\n")).toHaveLength(1)
    })

    it("signs the failure statement with the device key, so only this device can end its submission", async () => {
        const { machine, publicKey } = await booted((command) =>
            command === "npm run grade" ? undefined : passing(command),
        )
        const head = machine.git("rev-parse HEAD").trim()

        await run(machine, gradeLab())

        const grade = machine.uploads().find((upload) => upload.mutation === "relayLabGrade")?.input
        expect(grade?.tests).toEqual([])
        const text = gradeTextOf({
            submissionId: "sub-1",
            nonce: "nonce-1",
            commit: head,
            tests: [],
            failure: "no-readable-report",
        })
        expect(signatureHolds(publicKey, text, String(grade?.signature))).toBe(true)
    })

    it("reads the grader's own report when the manifest names one", async () => {
        const { machine } = await booted((command, cwd) => {
            if (command !== "npm run grade") return passing(command)
            mkdirSync(join(cwd, "reports"), { recursive: true })
            writeFileSync(join(cwd, "reports", "grader.xml"), REPORT_GRADE)
            return undefined
        })

        expect(
            await run(machine, labOfBody({ action: "grade", grade: { ...gradeBody(), report: "reports/grader.xml" } })),
        ).toBe(0)

        const grade = machine.uploads().find((upload) => upload.mutation === "relayLabGrade")?.input
        expect(grade?.failure).toBeUndefined()
        expect((grade?.tests as Array<unknown>).length).toBe(3)
    })

    it("cleans up when the grading command itself blows up, and the failure still reaches the caller", async () => {
        const { machine } = await booted()
        const boom = {
            ...machine,
            io: {
                ...machine.io,
                runCommand: (command: string, cwd: string, timeout: number, env?: Readonly<Record<string, string>>) =>
                    command === "npm run grade"
                        ? Promise.reject(new Error("the process went away"))
                        : machine.io.runCommand(command, cwd, timeout, env),
            },
        }

        await expect(run(boom, gradeLab())).rejects.toThrow("the process went away")

        const worktree =
            /worktree add --detach "([^"]+)"/u.exec(
                commandsOf(machine).find((c) => c.startsWith("git worktree add")) ?? "",
            )?.[1] ?? ""
        expect(exists(worktree)).toBe(false)
        expect(commandsOf(machine)).toContainEqual(expect.stringMatching(/^git worktree remove --force/u))
        expect(machine.git("worktree list").trim().split("\n")).toHaveLength(1)
    })

    it("ends the submission with run-failed when the commit cannot be checked out", async () => {
        const { machine } = await booted((command) =>
            command.startsWith("git worktree add") ? { exitCode: 128 } : grading(command),
        )

        expect(await run(machine, gradeLab())).toBe(1)

        expect(machine.world.err.join("\n")).toContain("Could not check out")
        expect(failureOf(machine)).toBe("run-failed")
    })

    it("wants a booted lab folder before it grades, and ends the submission with a signed lab-not-found instead of leaving it running", async () => {
        const machine = labWorld(grading)
        const key = newDeviceKey()
        writeDeviceKey(machine.world.io.env, key.privatePem)

        expect(await run(machine, gradeLab())).toBe(1)

        expect(machine.world.err.join("\n")).toContain("Boot the lab first")
        expect(failureOf(machine)).toBe("lab-not-found")
        const grade = machine.uploads().find((upload) => upload.mutation === "relayLabGrade")?.input
        expect(grade).toMatchObject({ submissionId: "sub-1", nonce: "nonce-1", commit: "0".repeat(40), tests: [] })
        const text = gradeTextOf({
            submissionId: "sub-1",
            nonce: "nonce-1",
            commit: "0".repeat(40),
            tests: [],
            failure: "lab-not-found",
        })
        expect(signatureHolds(key.publicKey, text, String(grade?.signature))).toBe(true)
    })

    it("only says to boot first, sending nothing, when the machine has no device key to sign with", async () => {
        const machine = labWorld(grading)

        expect(await run(machine, gradeLab())).toBe(1)

        expect(machine.uploads().some((upload) => upload.mutation === "relayLabGrade")).toBe(false)
    })

    it("grades the lab where its boot put it, though the grade manifest carries no learnerDir", async () => {
        const machine = labWorld(grading)
        const signed = join(machine.home, "work", "saga")
        writeDeviceKey(machine.world.io.env, newDeviceKey().privatePem)

        expect(await run(machine, labOfBody({ learnerDir: "~/work/saga" }))).toBe(0)
        expect(exists(join(signed, ".git"))).toBe(true)
        machine.ran.length = 0

        expect(await run(machine, gradeLab())).toBe(0)

        expect(failureOf(machine)).toBeUndefined()
        expect(machine.uploads().some((upload) => upload.mutation === "relayLabGrade")).toBe(true)
        expect(machine.world.err.join("\n")).not.toContain("Boot the lab first")
    })

    it("lets a learnerDir on a later boot move the lab, and a --dir outrank the booted folder", async () => {
        const machine = labWorld(grading)
        const typed = join(machine.world.cwd, "typed")
        await run(machine, labOfBody({ learnerDir: "~/work/saga" }))

        writeLabFolder(machine.world.io.env, "backend", "orders", typed)
        await run(machine, labOfBody())

        expect(exists(join(typed, ".git"))).toBe(true)
        expect(readBootedFolder(machine.world.io.env, "backend", "orders")).toBe(typed)
    })
})

describe("listen with a lab manifest", () => {
    const NOW = 1_800_000_000_000

    const frameOf = (
        lab: Record<string, unknown>,
        key = KEYS.privateKey,
        extra: Record<string, unknown> = {},
    ): { id: string; type: "manifest"; manifest: { payload: string; signature: string } } => {
        const payload = JSON.stringify({
            manifestId: "lab-m-1",
            taskId: "course:backend/orders",
            deviceId: "d-1",
            issuedAt: new Date(NOW - 1000).toISOString(),
            checks: [],
            lab,
            ...extra,
        })
        return {
            id: "manifest:lab-m-1",
            type: "manifest",
            manifest: { payload, signature: sign(null, Buffer.from(payload, "utf8"), key).toString("base64") },
        }
    }

    const listening = (answer: boolean) => {
        const machine = labWorld(passing)
        const questions: Array<string> = []
        let handlers: DeviceHandlers | undefined
        let end: (reason: string) => void = () => undefined
        const io = {
            ...machine.io,
            now: () => NOW,
            confirm: (question: string) => {
                questions.push(question)
                return Promise.resolve(answer)
            },
            listen: (_url: string, _token: string, given: DeviceHandlers) => {
                handlers = given
                return { ended: new Promise<string>((resolve) => (end = resolve)), close: () => end("closed") }
            },
        }
        return {
            machine,
            questions,
            pushed: async (frames: ReadonlyArray<unknown>) => {
                const running = listenCommand(io, { autoConfirm: false }, machine.world.cwd)
                handlers?.onFrame({ type: "hello", deviceId: "d-1" })
                frames.forEach((frame) => handlers?.onFrame(frame))
                end("closed")
                return running
            },
        }
    }

    it("shows the lab's commands, asks, then boots it and closes the watcher when listen ends", async () => {
        const listen = listening(true)

        expect(await listen.pushed([frameOf(labBody())])).toBe(0)

        expect(listen.questions[0]).toContain("boot the lab course:backend/orders")
        expect(listen.machine.world.out.join("\n")).toContain("compose: docker compose -p backend-orders")
        expect(bootsOf(listen.machine).at(-1)).toEqual(["first-run", "done"])
        expect(listen.machine.host.closed()).toBe(true)
    })

    it("names the folder the learner chose with lab start --dir, never ~/starci, in the lines it asks about", async () => {
        const listen = listening(false)
        const chosen = join(listen.machine.world.cwd, "my-labs", "orders")
        writeLabFolder(listen.machine.io.env, "backend", "orders", chosen)

        await listen.pushed([frameOf(labBody())])

        const shown = listen.machine.world.out.join("\n")
        expect(shown).toContain(`into ${chosen}; a folder that is already there is kept as it is`)
        expect(shown).toContain(`of ${chosen}`)
        expect(shown).not.toContain("~/starci")
    })

    it("unpacks into the learnerDir the server signed when no --dir was given, naming it in the lines", async () => {
        const listen = listening(true)
        const signed = join(listen.machine.home, "work", "saga")

        await listen.pushed([frameOf(labBody({ learnerDir: "~/work/saga" }))])

        const shown = listen.machine.world.out.join("\n")
        expect(shown).toContain(`into ${signed}; a folder that is already there is kept as it is`)
        expect(exists(join(signed, ".git"))).toBe(true)
        expect(exists(listen.machine.root)).toBe(false)
    })

    it("lets a local --dir outrank the signed learnerDir", async () => {
        const listen = listening(true)
        const chosen = join(listen.machine.world.cwd, "my-labs", "orders")
        writeLabFolder(listen.machine.io.env, "backend", "orders", chosen)

        await listen.pushed([frameOf(labBody({ learnerDir: "~/work/saga" }))])

        expect(exists(join(chosen, ".git"))).toBe(true)
        expect(exists(join(listen.machine.home, "work", "saga"))).toBe(false)
    })

    it.each([["relative/saga"], ["/"], ["~"]])(
        "refuses an unsafe learnerDir %j in both languages, asks nothing and unpacks nowhere, not even into the default",
        async (learnerDir) => {
            const listen = listening(true)

            await listen.pushed([frameOf(labBody({ learnerDir }))])

            const err = listen.machine.world.err.join("\n")
            expect(err).toContain("Không dùng thư mục StarCi gửi xuống")
            expect(err).toContain("Not using the folder StarCi sent")
            expect(listen.questions).toHaveLength(0)
            expect(listen.machine.ran).toHaveLength(0)
            expect(exists(listen.machine.root)).toBe(false)
        },
    )

    it("refuses an unsafe learnerDir that arrives under --auto-confirm too", async () => {
        const machine = labWorld(passing)
        let handlers: DeviceHandlers | undefined
        let end: (reason: string) => void = () => undefined
        const io = {
            ...machine.io,
            now: () => NOW,
            listen: (_url: string, _token: string, given: DeviceHandlers) => {
                handlers = given
                return { ended: new Promise<string>((resolve) => (end = resolve)), close: () => end("closed") }
            },
        }

        const running = listenCommand(io, { autoConfirm: true }, machine.world.cwd)
        handlers?.onFrame({ type: "hello", deviceId: "d-1" })
        handlers?.onFrame(frameOf(labBody({ learnerDir: "relative/saga" })))
        end("closed")
        await running

        expect(machine.world.err.join("\n")).toContain("Not using the folder StarCi sent")
        expect(machine.ran).toHaveLength(0)
        expect(exists(machine.root)).toBe(false)
    })

    it("runs nothing when the learner says no", async () => {
        const listen = listening(false)

        await listen.pushed([frameOf(labBody())])

        expect(listen.machine.ran).toHaveLength(0)
        expect(listen.machine.world.out.join("\n")).toContain("Not run.")
    })

    it("ignores a lab manifest StarCi did not sign, one for another device and one that is stale", async () => {
        const listen = listening(true)

        await listen.pushed([
            frameOf(labBody(), generateKeyPairSync("ed25519").privateKey),
            frameOf(labBody(), KEYS.privateKey, { deviceId: "d-2", manifestId: "lab-m-2" }),
            frameOf(labBody(), KEYS.privateKey, {
                issuedAt: new Date(NOW - 3_600_000).toISOString(),
                manifestId: "lab-m-3",
            }),
        ])

        expect(listen.machine.ran).toHaveLength(0)
        const err = listen.machine.world.err.join("\n")
        expect(err).toContain("did not sign")
        expect(err).toContain("another device")
        expect(err).toContain("stale request")
    })

    it("ignores a lab manifest whose task id names another lab, and runs a manifest delivered twice once", async () => {
        const listen = listening(true)

        await listen.pushed([
            frameOf(labBody(), KEYS.privateKey, { taskId: "course:backend/other", manifestId: "lab-m-4" }),
            frameOf(labBody()),
            frameOf(labBody()),
        ])

        expect(listen.machine.world.err.join(" ")).toContain("did not sign")
        expect(listen.questions).toHaveLength(1)
        expect(
            bootsOf(listen.machine).filter(([stage, status]) => stage === "machine" && status === "running"),
        ).toHaveLength(1)
    })
})

describe("what the lab commands send, against the core's schema snapshot", () => {
    it("sends, for a boot, a test, a chaos and a grade, only uploads that are valid inputs of their own mutation", async () => {
        const machine = labWorld(grading)
        await run(machine, labOfBody({ chaosOn: ["slow-db"] }))
        machine.host.trigger("src/orders.ts")
        await new Promise((resolve) => setTimeout(resolve, 0))
        await machine.state.sending
        await run(machine, labOfBody({ action: "test", chaosOn: ["slow-db"] }))
        await run(machine, labOfBody({ action: "chaos", chaosOn: [] }))
        writeDeviceKey(machine.world.io.env, newDeviceKey().privatePem)
        await run(machine, labOfBody({ action: "grade", grade: gradeBody() }))

        const uploads = machine.uploads()
        expect(new Set(uploads.map((upload) => upload.mutation))).toEqual(
            new Set(["relayLabBoot", "relayLabTests", "relayLabFiles", "relayLog", "relayLabGrade"]),
        )
        uploads.forEach((upload) => {
            const query = uploadMutationOf(upload.mutation as UploadMutation)
            expect(operationErrors(query)).toEqual([])
            expect({ mutation: upload.mutation, errors: inputErrors(query, upload.input) }).toEqual({
                mutation: upload.mutation,
                errors: [],
            })
        })
    })
})
