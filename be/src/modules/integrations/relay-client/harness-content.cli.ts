import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { CliIo } from "./relay-client.contracts"
import { DOCTOR_FOLDERS, type HarnessTool } from "./harness-trial.contracts"
import { refusalLine } from "./relay-api.client"
import { unpackSource } from "./source-pull.cli"
import { fetchManifest, flush, sessionOf } from "./task-run.cli"
import { readQueue, writeQueue } from "./upload-queue.adapter"
import { manifestKeyOf } from "./manifest-key.policy"

/** Where the content of one command lives on this machine. */
export interface HarnessContent {
    /** The folder of the doctor probes of a tool, or null when there is none. */
    probesDir(tool: HarnessTool): string | null
    /** The folder of a trap (`trap.yaml` and `repo/`), or null when there is none. */
    trapDir(trap: string): string | null
    /** Removes what was downloaded. */
    cleanup(): void
}

/** What a command asks the content for. */
export type ContentAsk =
    { readonly kind: "doctor"; readonly tool: HarnessTool } | { readonly kind: "trial"; readonly trap: string }

const firstExisting = (paths: ReadonlyArray<string>, marker: string): string | null =>
    paths.find((path) => existsSync(join(path, marker))) ?? null

/** The content of a starci-next-data checkout: `raw/harness/doctor/<tool>` and `raw/harness/trials/<trap>`. */
export const checkoutContent = (data: string): HarnessContent => ({
    probesDir: (tool) => firstExisting([join(data, "raw", "harness", "doctor", DOCTOR_FOLDERS[tool])], "."),
    trapDir: (trap) => firstExisting([join(data, "raw", "harness", "trials", trap)], "trap.yaml"),
    cleanup: () => undefined,
})

/**
 * The content of a command: a checkout when `--from` or `STARCI_NEXT_DATA_DIR` names one, else the tarball StarCi signed in the
 * manifest of `harness:doctor:<tool>` or `harness:trial:<trap>` (downloaded with the device bearer, its sha256 and listing checked,
 * unpacked into a temp folder). Prints why and answers null when there is none.
 */
export const harnessContentOf = async (
    io: CliIo,
    ask: ContentAsk,
    from: string | undefined,
): Promise<HarnessContent | null> => {
    const data = from ?? io.env.STARCI_NEXT_DATA_DIR
    if (data !== undefined) return checkoutContent(data)
    const read = sessionOf(io)
    if (read.kind === "unpaired") {
        io.err(
            "Pass --from <a starci-next-data checkout> (or set STARCI_NEXT_DATA_DIR), or pair this machine (starci-relay login) to get the content from StarCi.",
        )
        return null
    }
    const { session } = read
    writeQueue(io.env, await flush(io, session, readQueue(io.env)))
    const taskId = ask.kind === "doctor" ? `harness:doctor:${ask.tool}` : `harness:trial:${ask.trap}`
    const fetched = await fetchManifest(io, session, { taskId }, manifestKeyOf(io.env, session.baseUrl))
    if (fetched.kind !== "verified") {
        io.err(
            fetched.kind === "refused"
                ? refusalLine(fetched)
                : "The manifest is not signed by StarCi; nothing was run.",
        )
        return null
    }
    const { harness } = fetched.manifest
    const matches =
        ask.kind === "doctor"
            ? harness?.kind === "doctor" && harness.tool === ask.tool
            : harness?.kind === "trial" && harness.trap === ask.trap
    if (harness === undefined || (harness.kind !== "doctor" && harness.kind !== "trial") || !matches) {
        io.err("StarCi sent no content for this ask; nothing was run.")
        return null
    }
    const folder = mkdtempSync(join(tmpdir(), "starci-harness-content-"))
    const target = join(folder, "content")
    const cleanup = (): void => rmSync(folder, { recursive: true, force: true })
    const unpacked = await unpackSource(io, session, {
        noun: ask.kind === "doctor" ? "doctor probes" : "trap",
        source: harness.source,
        target,
        dir: ask.kind === "doctor" ? "doctor" : "repo",
        message: `"Harness ${ask.kind} content at ${harness.source.commit.slice(0, 10)}"`,
        finish: () => undefined,
    })
    if (!unpacked) {
        cleanup()
        return null
    }
    return {
        probesDir: (tool) =>
            firstExisting(
                [
                    join(target, "doctor", DOCTOR_FOLDERS[tool]),
                    join(target, "doctor", tool),
                    join(target, "raw", "harness", "doctor", DOCTOR_FOLDERS[tool]),
                ],
                ".",
            ),
        trapDir: (trap) => firstExisting([target, join(target, "raw", "harness", "trials", trap)], "trap.yaml"),
        cleanup,
    }
}
