import { Test } from "@nestjs/testing"
import { mockEntityManager } from "@starci/jest-preset"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { HarnessErrorCode } from "./errors/harness.error"
import type { HarnessRunRow } from "./harness.contracts"
import { HarnessReadService } from "./harness-read.service"
import { HARNESS_OPTIONS } from "./harness.decorators"
import type { ContentRow, PackRow, ProofRow } from "./persistence/harness.rows"
import {
    SELECT_BINDINGS,
    SELECT_PACK,
    SELECT_PROOFS,
    SELECT_PUBLISHED_KIND,
    SELECT_PUBLISHED_ONE,
} from "./persistence/harness.sql"

const LEARNER = "20000000-0000-4000-8000-000000000002"

const row = (kind: string, key: string, content: Record<string, unknown>): ContentRow => ({
    kind,
    content_key: key,
    version: "v",
    content_hash: "h",
    sort_index: 1,
    content,
})

const BUILD = row("build", "agent-cli", {
    id: "agent-cli",
    order: 1,
    title: { vi: "Agent", en: "Agent" },
    summary: { vi: "s", en: "s" },
    keys: [],
    runtime: { dir: "source", install: "npm ci", e2e: "npm run e2e", report: "r.xml" },
    stages: [
        { id: "s1", order: 1, title: { vi: "Mot", en: "One" }, summary: { vi: "", en: "" }, e2e: ["a"], steps: [] },
    ],
    packPaths: [],
})
const GUIDE = row("guide", "claude/claude-md", {
    tool: "claude",
    slug: "claude-md",
    order: 1,
    title: { vi: "Tieu de", en: "Title" },
    summary: { vi: "", en: "" },
    minutes: 5,
    probes: ["p"],
    sections: [{ id: "one", order: 1, title: { vi: "Mot", en: "One" }, body: { vi: "v", en: "e" }, run: ["ls"] }],
    contentHash: "h",
})
const PROBE = row("probe", "claude/p", {
    id: "p",
    tool: "claude",
    order: 1,
    title: { vi: "Nhan", en: "Label" },
    guide: "claude-md",
    fix: { vi: "Tao", en: "Create" },
    yaml: "id: p",
})
const TRAP = row("trap", "t", {
    id: "t",
    order: 1,
    title: { vi: "Bay", en: "Trap" },
    brief: { vi: "Ngan", en: "Brief" },
    prompt: "do it",
    tools: ["claude", "codex"],
    budget: { maxUsd: 0.5, maxTurns: 20, timeoutSec: 600 },
    shortcuts: [{ id: "env-read", title: { vi: "Doc env", en: "Reads env" } }],
    paths: ["trap.yaml"],
})

interface Options {
    readonly one?: ReadonlyArray<ContentRow>
    readonly proofs?: ReadonlyArray<ProofRow>
    readonly pack?: ReadonlyArray<PackRow>
    readonly bound?: string | null
}

const build = async (options: Options = {}) => {
    const em = mockEntityManager({
        query: [
            [SELECT_PUBLISHED_KIND, [BUILD]],
            [SELECT_PUBLISHED_ONE, [...(options.one ?? [GUIDE])]],
            [SELECT_PROOFS, [...(options.proofs ?? [])]],
            [SELECT_BINDINGS, []],
            [SELECT_PACK, [...(options.pack ?? [])]],
        ],
    })
    const kinds: Record<string, ReadonlyArray<ContentRow>> = {
        build: [BUILD],
        guide: [GUIDE],
        probe: [PROBE],
        trap: [TRAP],
    }
    em.query.mockImplementation(((text: unknown, params?: ReadonlyArray<unknown>) => {
        if (text === SELECT_PUBLISHED_KIND) return Promise.resolve([...(kinds[String(params?.[0])] ?? [])])
        if (text === SELECT_PUBLISHED_ONE) return Promise.resolve([...(options.one ?? [GUIDE])])
        if (text === SELECT_PROOFS) return Promise.resolve([...(options.proofs ?? [])])
        if (text === SELECT_BINDINGS) {
            return Promise.resolve(
                options.bound === undefined || options.bound === null
                    ? []
                    : [
                          {
                              build_id: "agent-cli",
                              learner_id: LEARNER,
                              binding_id: "b1",
                              repository: options.bound,
                              repository_id: null,
                          },
                      ],
            )
        }
        if (text === SELECT_PACK) return Promise.resolve([...(options.pack ?? [])])
        return Promise.reject(new Error("unstubbed"))
    }) as never)
    const moduleRef = await Test.createTestingModule({
        providers: [
            HarnessReadService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: HARNESS_OPTIONS, useValue: {} },
        ],
    }).compile()
    return moduleRef.get(HarnessReadService)
}

const DOCTOR: HarnessRunRow = {
    taskId: "harness:doctor",
    checkId: "p",
    ref: "claude",
    passed: false,
    commit: null,
    why: null,
    detail: { status: "failed", reason: "missing" },
    at: "2026-11-17T01:00:00.000Z",
}

describe("HarnessReadService", () => {
    it("lists the builds with the progress of the learner, proof from the attested rows and the bound project", async () => {
        const reads = await build({
            proofs: [
                {
                    build_id: "agent-cli",
                    stage_id: "s1",
                    e2e_id: "a",
                    passed: true,
                    run_id: "r",
                    commit_sha: "abc",
                    recorded_at: "2026-11-17T02:00:00.000Z",
                },
            ],
            bound: "learner/agent",
        })

        const [summary] = await reads.builds(LEARNER, "en", [])
        const detail = await reads.build(LEARNER, "vi", "agent-cli", [])

        expect(summary).toMatchObject({ id: "agent-cli", state: "proved", provedStages: 1 })
        expect(detail.repository).toEqual({
            bound: true,
            repository: "learner/agent",
            bindingId: "b1",
            audience: "starci-next",
        })
        await expect(reads.build(LEARNER, "vi", "ghost", [])).rejects.toMatchObject({ code: HarnessErrorCode.NotFound })
    })

    it("builds the hub of three parts in the asked locale", async () => {
        const reads = await build()

        const hub = await reads.hub(LEARNER, "vi", [], [])

        expect(hub.parts.map((part) => [part.key, part.total])).toEqual([
            ["build", 1],
            ["use", 1],
            ["docs", 0],
        ])
        expect(hub.parts[0]?.title).toBe("Xây")
        expect((await reads.hub(LEARNER, "en", [], [])).parts[1]?.title).toBe("Use")
    })

    it("lists the guides and docs as plain text pages and nothing of a build, a probe or a trap", async () => {
        const reads = await build()

        const pages = await reads.pages("en")

        expect(pages).toEqual([
            {
                kind: "guide",
                tool: "claude",
                slug: "claude-md",
                title: "Title",
                summary: "",
                sections: [{ id: "one", order: 1, title: "One", body: "e", run: ["ls"] }],
            },
        ])
        expect(JSON.stringify(pages)).not.toContain("agent-cli")
    })

    it("reads a guide with the probe results the learner CLI uploaded, and lists the guides of one tool", async () => {
        const reads = await build()

        const guide = await reads.guide("claude", "claude-md", "en", [DOCTOR])
        const guides = await reads.guides("codex", "en")

        expect(guide.sections[0]).toMatchObject({ title: "One", body: "e", run: ["ls"] })
        expect(guide.probes[0]).toMatchObject({ id: "p", status: "failed", fix: "Create", guide: "claude-md" })
        expect(guides).toEqual([])
    })

    it("reads the doctor of a tool with its counts and the traps with their newest result", async () => {
        const reads = await build()

        const doctor = await reads.doctor("claude", "vi", [{ ...DOCTOR, passed: true, detail: null }])
        const traps = await reads.trials("vi", "codex", [
            {
                taskId: "harness:trial",
                checkId: "t",
                ref: "codex",
                passed: true,
                commit: null,
                why: null,
                detail: { verdict: "held", testsGreen: true },
                at: "2026-11-17T01:00:00.000Z",
            },
        ])

        expect(doctor).toMatchObject({ tool: "claude", passed: 1, total: 1 })
        expect(traps[0]).toMatchObject({
            id: "t",
            prompt: "do it",
            brief: "Ngan",
            last: { verdict: "held", tool: "codex" },
        })
    })

    it("answers a pack with its hash and version, and an unknown one as HARNESS_NOT_FOUND", async () => {
        const found = await build({ pack: [{ version: "v1", pack: Buffer.from("tgz"), pack_sha256: "f".repeat(64) }] })
        const missing = await build({ pack: [], one: [] })

        await expect(found.pack("build", "agent-cli")).resolves.toEqual({
            content: Buffer.from("tgz"),
            sha256: "f".repeat(64),
            commit: "v1",
        })
        await expect(missing.pack("trap", "t")).rejects.toMatchObject({ code: HarnessErrorCode.NotFound })
        await expect(missing.doc("ghost", "vi")).rejects.toMatchObject({ code: HarnessErrorCode.NotFound })
    })
})
