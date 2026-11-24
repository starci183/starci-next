import { createHash } from "node:crypto"
import type { CliIo } from "./relay-client.contracts"
import { readTreeFile, readTreeText } from "./lab-files.adapter"
import { writeLabFile } from "./lab-workspace.adapter"

/**
 * The dependency install of a lab folder. A lab ships its `package-lock.json` but never its `node_modules` (a tarball of it would be
 * huge and tied to one OS), so before the first test the relay installs what the lab declares. Without it `npm test` finds no jest.
 */

/** The lockfile whose presence makes `npm ci` the default install. */
const LOCKFILE = "package-lock.json"

/**
 * The default install: `npm ci` keeps the lockfile exact. `--prefer-offline` reads the user's shared npm cache first, which the lab
 * folder's own install filled, so a grading checkout installs from disk in seconds instead of downloading again.
 */
export const DEFAULT_INSTALL = "npm ci --prefer-offline --no-audit --no-fund"

/**
 * The stamp the relay leaves inside `node_modules` after an install: the command and the lockfile hash. A later run with the same
 * stamp skips the install, so a test or chaos run does not pay for an install that already happened.
 */
const STAMP = "node_modules/.starci-install"

/** How long an install may take: a cold cache downloads every package. */
export const INSTALL_TIMEOUT_MS = 900_000

/** The install command of a project folder: the declared one, else `npm ci` when a lockfile is there, else none. */
export const installCommandOf = (declared: string | undefined, work: string): string | null => {
    if (declared !== undefined) return declared
    return readTreeFile(work, LOCKFILE) === null ? null : DEFAULT_INSTALL
}

/** The stamp of one install: the command and the sha256 of the lockfile (empty when there is none). */
const stampOf = (command: string, work: string): string => {
    const lock = readTreeFile(work, LOCKFILE)
    return `${command}\n${lock === null ? "" : createHash("sha256").update(lock).digest("hex")}\n`
}

/** What an install came to: whether the folder is ready to test and a short detail for a boot stage. */
export interface InstallResult {
    readonly ok: boolean
    readonly detail: string
}

/**
 * Installs the dependencies of a project folder when they are missing or stale, saying what it does in Vietnamese and English on
 * `say` (stderr for the MCP, whose stdout is JSON-RPC). `env` reaches the install so it sees the same compose project as the tests.
 */
export const installDeps = async (
    io: CliIo,
    work: string,
    declared: string | undefined,
    options: {
        readonly env: Readonly<Record<string, string>>
        readonly quiet: boolean
        readonly say: (line: string) => void
    },
): Promise<InstallResult> => {
    const command = installCommandOf(declared, work)
    if (command === null) return { ok: true, detail: "no dependencies to install" }
    const stamp = stampOf(command, work)
    if (readTreeText(work, STAMP) === stamp) return { ok: true, detail: "dependencies already installed" }
    options.say(`Đang cài thư viện của lab: ${command} (lần đầu có thể mất vài phút)...`)
    options.say(`Installing the lab's dependencies: ${command} (the first time may take a few minutes)...`)
    const run = await io.runCommand(command, work, INSTALL_TIMEOUT_MS, options.env, options.quiet)
    if (run.exitCode !== 0) {
        io.err(`Cài thư viện hỏng (exit ${run.exitCode}). Xem lỗi ở trên rồi chạy lại.`)
        io.err(`The install failed (exit ${run.exitCode}). See the error above, then run again.`)
        return { ok: false, detail: `${command} failed (exit ${run.exitCode}).` }
    }
    // Written only after a green install, so a half install is tried again next time instead of being trusted.
    writeLabFile(work, STAMP, stamp)
    options.say(`Đã cài xong thư viện (${Math.round(run.durationMs / 1000)} giây).`)
    options.say(`Dependencies installed (${Math.round(run.durationMs / 1000)} s).`)
    return { ok: true, detail: "dependencies installed" }
}
