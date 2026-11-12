import { generateKeyPairSync, sign } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Test } from "@nestjs/testing"
import { isRecord, jsonOf } from "./json.mapper"
import { ManifestPolicy } from "./manifest.policy"
import { ProjectKitService } from "./project-kit.service"
import type { CheckRun, CliIo, FetchAnswer, FetchInit } from "./relay-client.contracts"

const KEYS = generateKeyPairSync("ed25519")
const PUBLIC_PEM = KEYS.publicKey.export({ type: "spki", format: "pem" }).toString()
const TOKEN = "t".repeat(43)
const PROJECT = "7c1d2a3e-0000-4000-8000-000000000001"
const COMMIT = "a".repeat(40)
const PLAN = {
    milestone: "bf-data-and-cache",
    report: "starci/reports/junit.xml",
    concepts: ["transactions-and-isolation"],
}
const REPORT = `<testsuites>
<testcase name="[transactions-and-isolation] last item sells once" classname="t"/>
<testcase name="[idempotency] outside the milestone" classname="t"/>
</testsuites>`
const KIT_YAML = 'project: "<project-id>"\nlanguage: typescript\ntest:\n  command: node --test\n'

/** A signed manifest answer of the relay. */
const manifestAnswer = (plan: unknown): FetchAnswer => {
    const checks = [{ id: "test", command: "node --test", cwd: ".", timeoutMs: 600_000 }]
    const body = { manifestId: "m-1", taskId: PROJECT, checks }
    const payload = JSON.stringify(plan === undefined ? body : { ...body, plan })
    const signature = sign(null, Buffer.from(payload, "utf8"), KEYS.privateKey).toString("base64")
    return { status: 200, text: JSON.stringify({ data: { relayManifest: { manifestId: "m-1", payload, signature } } }) }
}

/** The folder of a learner project with its kit file and, when given, a JUnit report. */
const projectOf = (report: string | null, projectId: string = PROJECT): string => {
    const cwd = mkdtempSync(join(tmpdir(), "starci-project-"))
    mkdirSync(join(cwd, "starci"), { recursive: true })
    writeFileSync(
        join(cwd, "starci", "project.yaml"),
        `project: "${projectId}"\ntest:\n  command: node --test\n  report: starci/reports/junit.xml\n`,
    )
    if (report === null) return cwd
    mkdirSync(join(cwd, "starci", "reports"), { recursive: true })
    writeFileSync(join(cwd, "starci", "reports", "junit.xml"), report)
    return cwd
}

/** A starci-next-data checkout with a two-file kit and the four CI templates. */
const dataCheckout = (): string => {
    const root = mkdtempSync(join(tmpdir(), "starci-data-"))
    const kit = join(root, "projects", "kit")
    mkdirSync(join(kit, "starci", "e2e"), { recursive: true })
    mkdirSync(join(kit, "ci"), { recursive: true })
    writeFileSync(join(kit, "starci", "project.yaml"), KIT_YAML)
    writeFileSync(join(kit, "starci", "e2e", "idempotency.md"), "# idempotency\n")
    ;["0-typescript", "1-java", "2-csharp", "3-go"].forEach((name) =>
        writeFileSync(join(kit, "ci", `${name}.yml`), `name: ${name}\n`),
    )
    return root
}

/** What a spec decides about the machine and StarCi. */
interface Setup {
    /** Whether the machine is paired. */
    readonly paired?: boolean
    /** The exit code of the test command. */
    readonly exitCode?: number
    /** Extra environment settings. */
    readonly env?: Readonly<Record<string, string>>
}

/** The service, and a fake terminal and StarCi: the manifest query answers `manifest`, every upload is accepted. */
const worldOf = async (manifest: FetchAnswer, setup: Setup = {}) => {
    const home = mkdtempSync(join(tmpdir(), "starci-next-"))
    if (setup.paired !== false)
        writeFileSync(join(home, "config.json"), JSON.stringify({ baseUrl: "https://app.test", deviceToken: TOKEN }))
    const out: Array<string> = []
    const err: Array<string> = []
    const operations: Array<{ readonly name: string; readonly input: Record<string, unknown> }> = []
    const commands: Array<string> = []
    let counter = 0
    const moduleRef = await Test.createTestingModule({ providers: [ProjectKitService] }).compile()
    const policy = new ManifestPolicy()
    const io: CliIo = {
        env: {
            STARCI_NEXT_HOME: home,
            STARCI_NEXT_URL: "https://app.test",
            STARCI_NEXT_MANIFEST_KEY: PUBLIC_PEM,
            ...setup.env,
        },
        out: (line) => out.push(line),
        err: (line) => err.push(line),
        fetch: (_url: string, init: FetchInit) => {
            const read = jsonOf(init.body)
            const record = read.kind === "read" && isRecord(read.value) ? read.value : {}
            const query = typeof record.query === "string" ? record.query : ""
            const variables = isRecord(record.variables) ? record.variables : {}
            const name = /\{ (\w+)\(/u.exec(query)?.[1] ?? ""
            operations.push({ name, input: isRecord(variables.input) ? variables.input : {} })
            return Promise.resolve(
                name === "relayManifest" ? manifest : { status: 200, text: JSON.stringify({ data: {} }) },
            )
        },
        sleep: () => Promise.resolve(),
        now: () => 0,
        ids: () => {
            counter += 1
            return `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`
        },
        hostName: () => "laptop",
        platform: () => "linux",
        confirm: () => Promise.resolve(true),
        exit: () => undefined,
        verify: (payload, signature, key) => policy.verified(payload, signature, key),
        runCommand: (command: string): Promise<CheckRun> => {
            commands.push(command)
            return Promise.resolve(
                command.startsWith("git")
                    ? { exitCode: 0, output: `${COMMIT}\n`, durationMs: 1 }
                    : { exitCode: setup.exitCode ?? 0, output: "ok", durationMs: 42 },
            )
        },
    }
    return { kit: moduleRef.get(ProjectKitService), io, out, err, operations, commands }
}

describe("ProjectKitService run", () => {
    it("sends the learner's test command and the milestone, runs it, and uploads a practice result per tagged concept", async () => {
        const world = await worldOf(manifestAnswer(PLAN))

        const code = await world.kit.run(world.io, "bf-data-and-cache", true, projectOf(REPORT))

        expect(code).toBe(0)
        expect(world.operations[0]).toEqual({
            name: "relayManifest",
            input: {
                taskId: PROJECT,
                milestone: "bf-data-and-cache",
                testCommand: "node --test",
                testReport: "starci/reports/junit.xml",
            },
        })
        expect(world.operations.map((operation) => operation.name)).toEqual([
            "relayManifest",
            "relayManifestAck",
            "relayCheckStarted",
            "relayLog",
            "relayCheckResult",
        ])
        expect(world.operations[4]?.input).toMatchObject({
            taskId: PROJECT,
            checkId: "test",
            conceptId: "transactions-and-isolation",
            slot: "test",
            ref: "[transactions-and-isolation] last item sells once",
            passed: true,
            commit: COMMIT,
        })
        expect(world.commands).toEqual(["node --test", "git rev-parse HEAD"])
        expect(world.out).toContain("  transactions-and-isolation: passed (1 test(s))")
        expect(world.out.at(-1)).toBe("Results sent to StarCi (practice).")
    })

    it("reports a failing tagged test as failed, and fails the run", async () => {
        const failing = REPORT.replace('once" classname="t"/>', 'once" classname="t"><failure message="x"/></testcase>')
        const world = await worldOf(manifestAnswer(PLAN), { exitCode: 1 })

        const code = await world.kit.run(world.io, "bf-data-and-cache", true, projectOf(failing))

        expect(code).toBe(1)
        expect(world.operations.at(-1)?.input).toMatchObject({ passed: false })
    })

    it("uploads no result when no test is tagged, fails when the report is missing, and runs nothing when declined", async () => {
        const untagged = await worldOf(manifestAnswer(PLAN))
        await untagged.kit.run(untagged.io, "bf-data-and-cache", true, projectOf("<testsuites/>"))
        expect(untagged.out.some((line) => line.startsWith("No test is tagged"))).toBe(true)
        expect(untagged.operations.map((operation) => operation.name)).not.toContain("relayCheckResult")

        const missing = await worldOf(manifestAnswer(PLAN))
        const bare = projectOf(null)
        expect(await missing.kit.run(missing.io, "bf-data-and-cache", true, bare)).toBe(1)
        expect(missing.err[0]).toContain("No JUnit report")
        expect(existsSync(join(bare, "starci", "reports"))).toBe(true)

        const declined = await worldOf(manifestAnswer(PLAN))
        const io = { ...declined.io, confirm: () => Promise.resolve(false) }
        expect(await declined.kit.run(io, "bf-data-and-cache", false, projectOf(REPORT))).toBe(0)
        expect(declined.commands).toEqual([])
    })
})

describe("ProjectKitService run refusals", () => {
    it("refuses without a pairing, without a project id, and when the manifest is not a project run", async () => {
        const unpaired = await worldOf(manifestAnswer(PLAN), { paired: false })
        expect(await unpaired.kit.run(unpaired.io, "m", true, projectOf(REPORT))).toBe(1)
        expect(unpaired.err[0]).toContain("starci-next login")

        const noId = await worldOf(manifestAnswer(PLAN))
        expect(await noId.kit.run(noId.io, "m", true, projectOf(REPORT, "<project-id>"))).toBe(1)
        expect(noId.err[0]).toContain("starci-next init")

        const plain = await worldOf(manifestAnswer(undefined))
        expect(await plain.kit.run(plain.io, "m", true, projectOf(REPORT))).toBe(1)
        expect(plain.commands).toEqual([])
    })

    it("prints the relay's refusal, and refuses a manifest StarCi did not sign", async () => {
        const refused = await worldOf({
            status: 401,
            text: JSON.stringify({ errors: [{ extensions: { code: "RELAY_DEVICE_REVOKED" } }] }),
        })
        expect(await refused.kit.run(refused.io, "m", true, projectOf(REPORT))).toBe(1)
        expect(refused.err[0]).toContain("RELAY_DEVICE_REVOKED")

        const forged = await worldOf({
            status: 200,
            text: JSON.stringify({ data: { relayManifest: { payload: "{}", signature: "AA==" } } }),
        })
        expect(await forged.kit.run(forged.io, "m", true, projectOf(REPORT))).toBe(1)
        expect(forged.err[0]).toContain("not signed by StarCi")
        expect(forged.commands).toEqual([])
    })

    it("tells a StarCi project from another folder", async () => {
        const world = await worldOf(manifestAnswer(PLAN))

        expect(world.kit.isProject(projectOf(null))).toBe(true)
        expect(world.kit.isProject(mkdtempSync(join(tmpdir(), "starci-empty-")))).toBe(false)
    })
})

describe("ProjectKitService init", () => {
    it("copies the kit and the CI template of the language, and writes the project id and language", async () => {
        const cwd = mkdtempSync(join(tmpdir(), "starci-learner-"))
        const world = await worldOf(manifestAnswer(PLAN))

        const code = world.kit.init(
            world.io,
            { from: dataCheckout(), project: "p-1", language: "go", force: false },
            cwd,
        )

        expect(code).toBe(0)
        const yaml = readFileSync(join(cwd, "starci", "project.yaml"), "utf8")
        expect(yaml).toContain('project: "p-1"')
        expect(yaml).toContain("language: go")
        expect(existsSync(join(cwd, "starci", "e2e", "idempotency.md"))).toBe(true)
        expect(readFileSync(join(cwd, ".github", "workflows", "starci.yml"), "utf8")).toBe("name: 3-go\n")
        expect(world.out).toContain("  wrote starci/project.yaml")
    })

    it("keeps files that exist unless forced, yet still writes a given project id", async () => {
        const cwd = mkdtempSync(join(tmpdir(), "starci-learner-"))
        const data = dataCheckout()
        const world = await worldOf(manifestAnswer(PLAN))
        world.kit.init(world.io, { from: data, force: false }, cwd)
        writeFileSync(join(cwd, "starci", "e2e", "idempotency.md"), "mine\n")

        world.kit.init(world.io, { from: data, project: "p-2", force: false }, cwd)

        expect(readFileSync(join(cwd, "starci", "e2e", "idempotency.md"), "utf8")).toBe("mine\n")
        expect(readFileSync(join(cwd, "starci", "project.yaml"), "utf8")).toContain('project: "p-2"')
        expect(world.out.some((line) => line.startsWith("  kept starci/e2e/idempotency.md"))).toBe(true)

        world.kit.init(world.io, { from: data, force: true }, cwd)
        expect(readFileSync(join(cwd, "starci", "e2e", "idempotency.md"), "utf8")).toBe("# idempotency\n")
    })

    it("reads the kit from STARCI_NEXT_DATA_DIR when --from is not given", async () => {
        const cwd = mkdtempSync(join(tmpdir(), "starci-learner-"))
        const world = await worldOf(manifestAnswer(PLAN), { env: { STARCI_NEXT_DATA_DIR: dataCheckout() } })

        expect(world.kit.init(world.io, { force: false }, cwd)).toBe(0)
        expect(existsSync(join(cwd, "starci", "project.yaml"))).toBe(true)
    })

    it.each([
        ["an unknown language", { language: "ruby", force: false }, "Unknown language"],
        ["an invalid project id", { project: "<x>", force: false }, "project id"],
        ["no kit source", { force: false }, "--from"],
        ["a folder without a kit", { from: tmpdir(), force: false }, "No kit"],
    ])("refuses %s", async (_name, options, line) => {
        const world = await worldOf(manifestAnswer(PLAN))

        const code = world.kit.init(world.io, options, mkdtempSync(join(tmpdir(), "starci-learner-")))

        expect(code).toBe(1)
        expect(world.err[0]).toContain(line)
    })
})
