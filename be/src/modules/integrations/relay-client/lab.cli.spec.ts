import { generateKeyPairSync, sign } from "node:crypto"
import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { listenCommand } from "./listen.cli"
import { runLab, WATCH_DEBOUNCE_MS } from "./lab.cli"
import { readTreeText, writeDeviceKey } from "./lab-files.adapter"
import { gradeTextOf, newDeviceKey, signatureHolds } from "./lab-sign.policy"
import { labOf } from "./lab.policy"
import { COMMIT_B, REPORT_LAB, exists, gradeBody, labBody, labWorld, type Answer, type LabWorld } from "./lab.testing"
import type { LabSection } from "./lab.contracts"
import type { DeviceHandlers } from "./relay-client.contracts"
import { KEYS } from "./lesson.testing"

const labOfBody = (extra: Record<string, unknown> = {}): LabSection => labOf(labBody(extra)) as LabSection

/** A runner that passes everything and writes the lab report for the test command. */
const passing = (command: string): Answer => (command === "npm test" ? { report: REPORT_LAB } : undefined)

const run = (machine: LabWorld, lab: LabSection): Promise<number> => runLab(machine.io, machine.session, machine.state, lab)

const bootsOf = (machine: LabWorld): Array<[string, string]> =>
    machine
        .uploads()
        .filter((upload) => upload.mutation === "relayLabBoot")
        .map((upload) => [String(upload.input.stage), String(upload.input.status)])

describe("runLab boot", () => {
    it("reports every stage running then done, clones, composes with the chaos env, seeds and runs the tests", async () => {
        const machine = labWorld(passing)

        expect(await run(machine, labOfBody({ chaosOn: ["slow-db"] }))).toBe(0)

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
        const commands = machine.ran.map((ran) => ran.command)
        expect(commands).toContain(
            `git clone --branch main --single-branch https://github.com/learner/backend.git "${machine.root}"`,
        )
        const compose = machine.ran.find((ran) => ran.command.startsWith("docker compose"))
        expect(compose).toMatchObject({
            command: "docker compose -p backend-orders -f docker/compose.yml up -d --build",
            cwd: machine.root,
            env: { CHAOS_DB_DELAY_MS: "800" },
        })
        expect(commands).toContain("npm run seed")
        expect(machine.world.out.join("\n")).toContain("seed: npm run seed")
    })

    it("uploads lab.tests, lab.files and a log per service after the first run, and nothing it was not asked for", async () => {
        const machine = labWorld(passing)

        await run(machine, labOfBody({ chaosOn: ["drop-queue"] }))

        const uploads = machine.uploads()
        const tests = uploads.find((upload) => upload.mutation === "relayLabTests")?.input
        expect(tests).toMatchObject({
            taskId: "course:backend/orders",
            chaosOn: ["drop-queue"],
            tests: [
                { id: "orders-once", passed: true },
                { id: "stock-never-goes-negative", passed: false, message: "stock was -1" },
            ],
        })
        expect(String(tests?.commit)).toMatch(/^[0-9a-f]{40}$/u)
        const files = uploads.find((upload) => upload.mutation === "relayLabFiles")?.input
        expect((files?.files as Array<{ path: string; text: string }>).map((file) => file.path)).toEqual([
            "src/orders.ts",
            "src/stock.ts",
        ])
        const logs = uploads.filter((upload) => upload.mutation === "relayLog")
        expect(logs.map((log) => log.input.checkId)).toEqual(["api", "db"])
        expect(machine.ran.map((ran) => ran.command)).toContain(
            "docker compose -p backend-orders -f docker/compose.yml logs --no-color --tail 400 api",
        )
        const order = uploads.map((upload) => upload.mutation)
        expect(order.indexOf("relayLabTests")).toBeLessThan(order.indexOf("relayLabFiles"))
        expect(order.indexOf("relayLabFiles")).toBeLessThan(order.indexOf("relayLog"))
        expect(new Set(uploads.map((upload) => upload.input.eventId)).size).toBe(uploads.length)
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
        expect(machine.ran.map((ran) => ran.command)).toEqual(["docker info"])
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

        const last = machine.uploads().filter((upload) => upload.mutation === "relayLabBoot").at(-1)?.input
        expect(last).toMatchObject({ stage: "first-run", status: "failed" })
        expect(JSON.stringify(machine.uploads())).not.toContain("SECRET_TOKEN")
    })

    it("fetches and checks out the commit when the clone is already there, and refuses a clone of another repository", async () => {
        const machine = labWorld(passing)
        mkdirSync(join(machine.root, ".git"), { recursive: true })
        const lab = labOfBody({ repo: { url: "https://github.com/learner/backend.git", branch: "main", commit: COMMIT_B } })

        expect(await run(machine, lab)).toBe(0)
        const commands = machine.ran.map((ran) => ran.command)
        expect(commands).toContain("git fetch origin main")
        expect(commands).toContain(`git checkout --detach ${COMMIT_B}`)
        expect(commands.some((command) => command.startsWith("git clone"))).toBe(false)

        const other = labWorld(passing)
        mkdirSync(join(other.root, ".git"), { recursive: true })
        expect(
            await run(other, labOfBody({ repo: { url: "https://github.com/learner/other.git", branch: "main", commit: null } })),
        ).toBe(1)
        expect(bootsOf(other).at(-1)).toEqual(["clone", "failed"])
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
            expect.objectContaining({ path: "src/orders.ts", text: "export const orders = 1\n" }),
        ])
        expect(WATCH_DEBOUNCE_MS).toBe(400)
        expect(machine.host.closed()).toBe(false)

        await run(machine, labOfBody({ files: [] }))
        expect(machine.host.closed()).toBe(true)
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
    it("test runs the tests with the chaos env and uploads lab.tests and the logs, and wants a boot first", async () => {
        const machine = labWorld(passing)
        expect(await run(machine, labOfBody({ action: "test" }))).toBe(1)
        expect(machine.world.err.join("\n")).toContain("Boot the lab first")

        mkdirSync(join(machine.root, ".git"), { recursive: true })
        expect(await run(machine, labOfBody({ action: "test", chaosOn: ["drop-queue"] }))).toBe(0)

        expect(machine.ran.find((ran) => ran.command === "npm test")).toMatchObject({ env: { CHAOS_DROP_QUEUE: "1" } })
        expect(machine.uploads().map((upload) => upload.mutation)).toEqual(["relayLabTests", "relayLog", "relayLog"])
    })

    it("chaos brings the stack up again with the new env, then runs the tests", async () => {
        const machine = labWorld(passing)
        mkdirSync(join(machine.root, ".git"), { recursive: true })

        expect(await run(machine, labOfBody({ action: "chaos", chaosOn: ["slow-db"] }))).toBe(0)

        const commands = machine.ran.map((ran) => ran.command)
        expect(commands[0]).toBe("docker compose -p backend-orders -f docker/compose.yml up -d")
        expect(machine.ran[0]?.env).toEqual({ CHAOS_DB_DELAY_MS: "800" })
        expect(commands).toContain("npm test")
        expect(commands.indexOf("npm test")).toBeGreaterThan(0)
    })

    it("chaos stops when compose fails and runs no tests", async () => {
        const machine = labWorld((command) => (command.startsWith("docker compose") ? { exitCode: 1 } : undefined))
        mkdirSync(join(machine.root, ".git"), { recursive: true })

        expect(await run(machine, labOfBody({ action: "chaos" }))).toBe(1)

        expect(machine.ran.map((ran) => ran.command)).not.toContain("npm test")
    })
})

describe("runLab grade", () => {
    const gradeLab = (content?: string, sha256?: string): LabSection =>
        labOfBody({ action: "grade", chaosOn: ["slow-db"], grade: gradeBody(content, sha256) })

    const withKey = (machine: LabWorld): string => {
        const key = newDeviceKey()
        writeDeviceKey(machine.world.io.env, key.privatePem)
        mkdirSync(join(machine.root, ".git"), { recursive: true })
        return key.publicKey
    }

    it("grades in a clean checkout with the hidden files, deletes them and the worktree, and uploads a signature that holds", async () => {
        let seen: { hidden: boolean; cwd: string } | undefined
        const machine = labWorld((command, cwd) => {
            if (command !== "npm test") return undefined
            seen = { hidden: exists(join(cwd, "hidden", "orders.hidden.test.ts")), cwd }
            return { report: REPORT_LAB }
        })
        const publicKey = withKey(machine)

        expect(await run(machine, gradeLab())).toBe(0)

        expect(seen?.hidden).toBe(true)
        expect(seen?.cwd).not.toBe(machine.root)
        const test = machine.ran.find((ran) => ran.command === "npm test")
        expect(test?.env).toEqual({ CHAOS_DB_DELAY_MS: "800", STARCI_SEED_ORDER: "base,orders" })
        const commands = machine.ran.map((ran) => ran.command)
        expect(commands[0]).toMatch(new RegExp(`^git worktree add --detach ".+" ${COMMIT_B}$`, "u"))
        expect(commands).toContainEqual(expect.stringMatching(/^git worktree remove --force ".+"$/u))
        expect(commands).toContain("git worktree prune")
        expect(exists(seen?.cwd ?? "")).toBe(false)
        expect(exists(join(seen?.cwd ?? "", "hidden"))).toBe(false)
        expect(readTreeText(machine.root, "hidden/orders.hidden.test.ts")).toBeNull()

        const grade = machine.uploads().find((upload) => upload.mutation === "relayLabGrade")?.input
        expect(grade).toMatchObject({ taskId: "course:backend/orders", submissionId: "sub-1", nonce: "nonce-1", commit: COMMIT_B })
        const tests = grade?.tests as Array<{ id: string }>
        expect(tests.map((item) => item.id)).toEqual(["orders-once", "stock-never-goes-negative"])
        const text = gradeTextOf({
            submissionId: "sub-1",
            nonce: "nonce-1",
            commit: COMMIT_B,
            tests: tests as never,
        })
        expect(signatureHolds(publicKey, text, String(grade?.signature))).toBe(true)
    })

    it("never uploads the hidden file's content, its path or a service log", async () => {
        const machine = labWorld(() => ({ report: REPORT_LAB }))
        withKey(machine)

        await run(machine, gradeLab("SECRET HIDDEN SOURCE"))

        const sent = JSON.stringify(machine.uploads())
        expect(sent).not.toContain("SECRET HIDDEN SOURCE")
        expect(sent).not.toContain(Buffer.from("SECRET HIDDEN SOURCE").toString("base64"))
        expect(sent).not.toContain("orders.hidden.test.ts")
        expect(machine.uploads().map((upload) => upload.mutation)).toEqual(["relayLabGrade"])
    })

    it("refuses a hidden file whose hash is wrong before it makes any checkout", async () => {
        const machine = labWorld(passing)
        withKey(machine)

        expect(await run(machine, gradeLab("content", "0".repeat(64)))).toBe(1)

        expect(machine.world.err.join("\n")).toContain("does not match its hash")
        expect(machine.ran).toHaveLength(0)
        expect(machine.uploads()).toHaveLength(0)
    })

    it("grades nothing without a device key", async () => {
        const machine = labWorld(passing)
        mkdirSync(join(machine.root, ".git"), { recursive: true })

        expect(await run(machine, gradeLab())).toBe(1)

        expect(machine.world.err.join("\n")).toContain("no device key")
        expect(machine.ran).toHaveLength(0)
    })

    it("cleans up and sends nothing when the grading run writes no report", async () => {
        const machine = labWorld(() => undefined)
        withKey(machine)

        expect(await run(machine, gradeLab())).toBe(1)

        const worktree = /worktree add --detach "([^"]+)"/u.exec(machine.ran[0]?.command ?? "")?.[1] ?? ""
        expect(exists(worktree)).toBe(false)
        expect(machine.ran.map((ran) => ran.command)).toContainEqual(expect.stringMatching(/^git worktree remove --force/u))
        expect(machine.uploads()).toHaveLength(0)
    })

    it("cleans up when the test command itself blows up, and the failure still reaches the caller", async () => {
        const base = labWorld(passing)
        withKey(base)
        const boom = {
            ...base,
            io: {
                ...base.io,
                runCommand: (command: string, cwd: string, timeout: number, env?: Readonly<Record<string, string>>) =>
                    command === "npm test"
                        ? Promise.reject(new Error("the process went away"))
                        : base.io.runCommand(command, cwd, timeout, env),
            },
        }

        await expect(run(boom, gradeLab())).rejects.toThrow("the process went away")

        const worktree = /worktree add --detach "([^"]+)"/u.exec(base.ran[0]?.command ?? "")?.[1] ?? ""
        expect(exists(worktree)).toBe(false)
        expect(base.ran.map((ran) => ran.command)).toContainEqual(expect.stringMatching(/^git worktree remove --force/u))
        expect(base.uploads()).toHaveLength(0)
    })

    it("sends nothing and cleans up when the commit cannot be checked out", async () => {
        const machine = labWorld((command) => (command.startsWith("git worktree add") ? { exitCode: 128 } : undefined))
        withKey(machine)

        expect(await run(machine, gradeLab())).toBe(1)

        expect(machine.world.err.join("\n")).toContain("Could not check out")
        expect(machine.uploads()).toHaveLength(0)
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
            frameOf(labBody(), KEYS.privateKey, { issuedAt: new Date(NOW - 3_600_000).toISOString(), manifestId: "lab-m-3" }),
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
        expect(bootsOf(listen.machine).filter(([stage, status]) => stage === "machine" && status === "running")).toHaveLength(1)
    })
})
