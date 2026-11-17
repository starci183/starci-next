import { generateKeyPairSync, verify } from "node:crypto"
import { Test } from "@nestjs/testing"
import type { StoredBuild } from "@modules/domain/harness"
import { manifestPayloadOf, signManifest, signingKeyOf } from "./relay-feed.policy"
import {
    HARNESS_PACK_MAX_BYTES,
    commitOf,
    harnessBuildIdOfTask,
    harnessBuildManifestOf,
    harnessBuildPackPathOf,
    harnessDoctorManifestOf,
    harnessTargetOfTask,
    harnessTrialManifestOf,
} from "./relay-harness-manifest.policy"

const POLICY = Symbol("relay-harness-manifest-policy")

const policies = {
    commitOf,
    harnessBuildIdOfTask,
    harnessBuildManifestOf,
    harnessBuildPackPathOf,
    harnessDoctorManifestOf,
    harnessTargetOfTask,
    harnessTrialManifestOf,
}

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

const BUILD: StoredBuild = {
    id: "agent-cli",
    order: 1,
    title: { vi: "a", en: "a" },
    summary: { vi: "", en: "" },
    keys: [{ id: "llm", anyOf: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"], note: null }],
    runtime: { dir: "source", install: "npm ci", e2e: "npm run e2e", report: "e2e/reports/junit.xml" },
    stages: [
        {
            id: "s1-loop",
            order: 1,
            title: { vi: "a", en: "a" },
            summary: { vi: "", en: "" },
            e2e: ["x", "y"],
            steps: [],
        },
    ],
    packPaths: ["e2e/a.ts", "source/b.ts"],
}

const SHA = "a".repeat(64)
const COMMIT = "0123456789abcdef0123456789abcdef01234567"

describe("harnessBuildManifestOf", () => {
    it("pins the tarball with its hash and the 40 hex commit and copies the way the build runs, without any note or title", async () => {
        const { harnessBuildManifestOf: manifest } = await build()

        const section = manifest(BUILD, { sha256: SHA, commit: COMMIT, size: 1000 })

        expect(section).toEqual({
            kind: "build",
            buildId: "agent-cli",
            source: { url: "/api/relay/harness/build/agent-cli/source.tgz", sha256: SHA, commit: COMMIT },
            dir: "source",
            install: "npm ci",
            e2e: "npm run e2e",
            report: "e2e/reports/junit.xml",
            keys: [{ id: "llm", anyOf: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY"] }],
            stages: [{ id: "s1-loop", e2e: ["x", "y"] }],
        })
    })

    it("derives a stable 40 hex commit for a version that is not one, so a local checkout can still run", async () => {
        const { commitOf: commit, harnessBuildManifestOf: manifest } = await build()

        expect(commit(COMMIT)).toBe(COMMIT)
        expect(commit("fp-/c")).toMatch(/^[0-9a-f]{40}$/u)
        expect(commit("fp-/c")).toBe(commit("fp-/c"))
        expect(manifest(BUILD, { sha256: SHA, commit: "a1b2c3d", size: 10 })?.source.commit).toMatch(/^[0-9a-f]{40}$/u)
    })

    it("refuses an empty tarball and one over the limit of the CLI", async () => {
        const { harnessBuildManifestOf: manifest } = await build()

        expect(manifest(BUILD, { sha256: SHA, commit: COMMIT, size: 0 })).toBeNull()
        expect(manifest(BUILD, { sha256: SHA, commit: COMMIT, size: HARNESS_PACK_MAX_BYTES + 1 })).toBeNull()
    })

    it("reads the build id of a harness build task and nothing else", async () => {
        const { harnessBuildIdOfTask: idOf } = await build()

        expect(idOf("harness:build:agent-cli")).toBe("agent-cli")
        expect(idOf("harness:build:Bad Id")).toBeNull()
        expect(idOf("lesson:x")).toBeNull()
        expect(idOf("harness:doctor")).toBeNull()
    })
})

describe("a signed harness manifest", () => {
    it("carries the harness section in the fixed key order and verifies with the relay public key", async () => {
        const { harnessBuildManifestOf: manifest } = await build()
        const pair = generateKeyPairSync("ed25519")
        const section = manifest(BUILD, { sha256: SHA, commit: COMMIT, size: 5 })
        if (section === null) throw new Error("no section")
        const body = {
            manifestId: "m",
            taskId: "harness:build:agent-cli",
            learnerId: "l",
            deviceId: "d",
            issuedAt: "2026-11-17T00:00:00.000Z",
            checks: [],
            harness: section,
        }

        const signed = signManifest(
            body,
            signingKeyOf(pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString()),
        )
        const parsed: { harness: Record<string, unknown> } = JSON.parse(manifestPayloadOf(body))

        expect(Object.keys(parsed.harness)).toEqual([
            "kind",
            "buildId",
            "source",
            "dir",
            "install",
            "e2e",
            "report",
            "keys",
            "stages",
        ])
        expect(Object.keys(parsed.harness["source"] as object)).toEqual(["url", "sha256", "commit"])
        expect(signed.payload).toBe(manifestPayloadOf(body))
        expect(
            verify(null, Buffer.from(signed.payload, "utf8"), pair.publicKey, Buffer.from(signed.signature, "base64")),
        ).toBe(true)
    })
})

describe("doctor and trial manifest sections", () => {
    it("names the target of a harness task: a build, the doctor of a tool or a trial trap, and nothing else", async () => {
        const { harnessTargetOfTask: target } = await build()

        expect(target("harness:build:agent-cli")).toEqual({ kind: "build", key: "agent-cli" })
        expect(target("harness:doctor:codex")).toEqual({ kind: "doctor", key: "codex" })
        expect(target("harness:trial:red-test")).toEqual({ kind: "trial", key: "red-test" })
        expect(target("harness:doctor:cursor")).toBeNull()
        expect(target("harness:doctor")).toBeNull()
        expect(target("harness:trial:Bad Id")).toBeNull()
        expect(target("harness:build:a:b")).toBeNull()
        expect(target("lesson:x")).toBeNull()
    })

    it("pins the probe tarball of a tool and the folder tarball of a trap like the build tarball", async () => {
        const { harnessDoctorManifestOf: doctor, harnessTrialManifestOf: trial } = await build()

        expect(doctor("claude", { sha256: SHA, commit: COMMIT, size: 10 })).toEqual({
            kind: "doctor",
            tool: "claude",
            source: { url: "/api/relay/harness/doctor/claude/probes.tgz", sha256: SHA, commit: COMMIT },
        })
        expect(trial("red-test", { sha256: SHA, commit: "local-label", size: 10 })).toMatchObject({
            kind: "trial",
            trap: "red-test",
            source: { url: "/api/relay/harness/trial/red-test/trap.tgz", sha256: SHA },
        })
        expect(trial("red-test", { sha256: SHA, commit: "local-label", size: 10 })?.source.commit).toMatch(
            /^[0-9a-f]{40}$/u,
        )
        expect(doctor("codex", { sha256: SHA, commit: COMMIT, size: 0 })).toBeNull()
        expect(trial("red-test", { sha256: SHA, commit: COMMIT, size: HARNESS_PACK_MAX_BYTES + 1 })).toBeNull()
    })

    it("signs the sections with the keys in the order the CLI reads", async () => {
        const { harnessDoctorManifestOf: doctor, harnessTrialManifestOf: trial } = await build()
        const base = {
            manifestId: "m",
            taskId: "t",
            learnerId: "l",
            deviceId: "d",
            issuedAt: "2026-11-17T00:00:00.000Z",
            checks: [],
        }
        const d = doctor("claude", { sha256: SHA, commit: COMMIT, size: 10 })
        const r = trial("red-test", { sha256: SHA, commit: COMMIT, size: 10 })
        if (d === null || r === null) throw new Error("no section")

        const doctorPayload: { harness: Record<string, unknown> } = JSON.parse(
            manifestPayloadOf({ ...base, harness: d }),
        )
        const trialPayload: { harness: Record<string, unknown> } = JSON.parse(
            manifestPayloadOf({ ...base, harness: r }),
        )

        expect(Object.keys(doctorPayload.harness)).toEqual(["kind", "tool", "source"])
        expect(Object.keys(trialPayload.harness)).toEqual(["kind", "trap", "source"])
        expect(Object.keys(trialPayload.harness["source"] as object)).toEqual(["url", "sha256", "commit"])
    })
})
