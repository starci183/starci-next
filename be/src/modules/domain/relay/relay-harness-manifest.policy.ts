import { createHash } from "node:crypto"
import type { StoredBuild } from "@modules/domain/harness"
import type { ManifestHarnessBuild, ManifestHarnessDoctor, ManifestHarnessTrial } from "./relay-feed.contracts"

/** The prefix of the task id of a harness build task, with the build id after it. */
const BUILD_TASK = "harness:build:"

/** The largest tarball the CLI takes. */
export const HARNESS_PACK_MAX_BYTES = 50 * 1024 * 1024

/** The path of a build tarball on the StarCi origin; the CLI sends its device token to it. */
export const harnessBuildPackPathOf = (buildId: string): string => `/api/relay/harness/build/${buildId}/source.tgz`

/** The build id of a `harness:build:<id>` task, or null for any other task. */
export const harnessBuildIdOfTask = (taskId: string): string | null => {
    if (!taskId.startsWith(BUILD_TASK)) return null
    const id = taskId.slice(BUILD_TASK.length)
    return /^[a-z0-9][a-z0-9-]{0,63}$/u.test(id) ? id : null
}

/** The 40 hex commit a manifest pins: the content version itself when it is one, else the SHA-1 hex of the version label (a local checkout). */
export const commitOf = (version: string): string =>
    /^[0-9a-f]{40}$/u.test(version) ? version : createHash("sha1").update(version).digest("hex")

/**
 * The harness section a build manifest signs: the tarball link with its hash and the 40 hex content commit (`commitOf`), how the build installs
 * and runs, the key names it looks for and its stages with their e2e ids. Null when the
 * tarball is empty or over the CLI limit, so the manifest is refused instead of signing a link the CLI would refuse.
 */
export const harnessBuildManifestOf = (
    build: StoredBuild,
    pack: { readonly sha256: string; readonly commit: string; readonly size: number },
): ManifestHarnessBuild | null => {
    if (pack.size > HARNESS_PACK_MAX_BYTES || pack.size < 1) return null
    return {
        kind: "build",
        buildId: build.id,
        source: { url: harnessBuildPackPathOf(build.id), sha256: pack.sha256, commit: commitOf(pack.commit) },
        dir: build.runtime.dir,
        install: build.runtime.install,
        e2e: build.runtime.e2e,
        report: build.runtime.report,
        keys: build.keys.map((key) => ({ id: key.id, anyOf: key.anyOf })),
        stages: build.stages.map((stage) => ({ id: stage.id, e2e: stage.e2e })),
    }
}

/** What a `harness:` task names: a build, the doctor of a tool or a trial trap. */
export type HarnessTaskTarget =
    | { readonly kind: "build"; readonly key: string }
    | { readonly kind: "doctor"; readonly key: "claude" | "codex" }
    | { readonly kind: "trial"; readonly key: string }

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/u

/** The target of a `harness:build:<id>`, `harness:doctor:<tool>` or `harness:trial:<trap>` task, or null for any other task. */
export const harnessTargetOfTask = (taskId: string): HarnessTaskTarget | null => {
    const [scope, kind, key, ...rest] = taskId.split(":")
    if (scope !== "harness" || rest.length > 0 || key === undefined) return null
    if (kind === "doctor") return key === "claude" || key === "codex" ? { kind, key } : null
    if ((kind === "build" || kind === "trial") && SLUG.test(key)) return { kind, key }
    return null
}

/** The path of the probe files of one tool on the StarCi origin. */
export const harnessDoctorPackPathOf = (tool: string): string => `/api/relay/harness/doctor/${tool}/probes.tgz`

/** The path of the folder of one trap on the StarCi origin. */
export const harnessTrapPackPathOf = (trap: string): string => `/api/relay/harness/trial/${trap}/trap.tgz`

/** The pinned link of a pack: its path, SHA-256 and 40 hex commit; null when the tarball is empty or over the CLI limit. */
const sourceOf = (
    url: string,
    pack: { readonly sha256: string; readonly commit: string; readonly size: number },
): ManifestHarnessDoctor["source"] | null =>
    pack.size > HARNESS_PACK_MAX_BYTES || pack.size < 1
        ? null
        : { url, sha256: pack.sha256, commit: commitOf(pack.commit) }

/** The signed doctor section of one tool. */
export const harnessDoctorManifestOf = (
    tool: "claude" | "codex",
    pack: { readonly sha256: string; readonly commit: string; readonly size: number },
): ManifestHarnessDoctor | null => {
    const source = sourceOf(harnessDoctorPackPathOf(tool), pack)
    return source === null ? null : { kind: "doctor", tool, source }
}

/** The signed trial section of one trap. */
export const harnessTrialManifestOf = (
    trap: string,
    pack: { readonly sha256: string; readonly commit: string; readonly size: number },
): ManifestHarnessTrial | null => {
    const source = sourceOf(harnessTrapPackPathOf(trap), pack)
    return source === null ? null : { kind: "trial", trap, source }
}
