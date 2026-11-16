import { join } from "node:path"
import type { CheckRun, CliIo } from "./relay-client.contracts"
import {
    ARCHIVE_NAME,
    dropArchive,
    hasFolder,
    makeFolder,
    removeFolder,
    writeArchive,
} from "./lesson-files.adapter"
import { ARCHIVE_MAX_BYTES, archiveRefusal, hashHolds } from "./source-archive.policy"
import type { RelaySession } from "./task-run.cli"

/** How long a git or tar step may take. */
const STEP_TIMEOUT_MS = 600_000

/** The URL a signed tarball is fetched from and whether StarCi's own bearer goes with it: a path is StarCi's own endpoint, an https URL is a signed one. */
export const sourceUrlOf = (
    url: string,
    session: RelaySession,
): { readonly url: string; readonly bearer: string | undefined } =>
    url.startsWith("/") ? { url: `${session.baseUrl}${url}`, bearer: session.token } : { url, bearer: undefined }

/** What unpacking a signed source asks of its caller. */
export interface SourceUnpack {
    /** What the thing is called in the lines printed (`lesson`, `build`). */
    readonly noun: string
    /** The signed tarball. */
    readonly source: { readonly url: string; readonly sha256: string; readonly commit: string }
    /** The folder to unpack into; it must not exist yet. */
    readonly target: string
    /** The project folder that must exist in the unpacked tree. */
    readonly dir: string
    /** The initial commit message, already quoted for the shell. */
    readonly message: string
    /** Runs after the unpack and before the first commit (to write files that must be in it, such as `.gitignore`). */
    readonly prepare?: (target: string) => void
    /** Runs after the first commit (to write the marker and the private git excludes). */
    readonly finish: (target: string) => void
}

/**
 * The one pull of a signed `source/` tarball, shared by `pull` (lesson) and `harness pull` (build): downloads it, refuses unless its
 * size and sha256 hold, lists it with `tar` and refuses any link, special file, absolute or drive path, backslash, `..` or first
 * segment `hidden`, unpacks it, requires `dir`, and makes one initial git commit. Any failure removes the folder it made.
 * Answers true when it unpacked; false after the line was printed.
 */
export const unpackSource = async (io: CliIo, session: RelaySession, plan: SourceUnpack): Promise<boolean> => {
    const { noun, source, target, dir } = plan
    const from = sourceUrlOf(source.url, session)
    const answer = await io.download(from.url, from.bearer)
    if (answer.status !== 200) {
        io.err(
            answer.status === 0 ? "StarCi could not be reached." : `The ${noun} source was refused (HTTP ${answer.status}).`,
        )
        return false
    }
    if (
        answer.bytes.length === 0 ||
        answer.bytes.length > ARCHIVE_MAX_BYTES ||
        !hashHolds(answer.bytes, source.sha256)
    ) {
        io.err("The downloaded source does not match the sha256 StarCi signed; nothing was unpacked.")
        return false
    }
    makeFolder(target)
    const failed = (line: string): boolean => {
        removeFolder(target)
        io.err(line)
        return false
    }
    const step = async (command: string): Promise<CheckRun> =>
        io.runCommand(command, target, STEP_TIMEOUT_MS, undefined, true)
    writeArchive(target, answer.bytes)
    const names = await step(`tar -tzf ${ARCHIVE_NAME}`)
    const types = await step(`tar -tvzf ${ARCHIVE_NAME}`)
    const refusal =
        names.exitCode === 0 && types.exitCode === 0
            ? archiveRefusal(names.output, types.output)
            : "tar could not read it"
    if (refusal !== null) return failed(`Not unpacked: ${refusal}.`)
    if ((await step(`tar -xzf ${ARCHIVE_NAME}`)).exitCode !== 0) return failed(`tar could not unpack the ${noun} source.`)
    dropArchive(target)
    if (!hasFolder(join(target, dir))) return failed(`The source has no folder ${dir}; nothing was selected.`)
    plan.prepare?.(target)
    const git = [
        "git init -q -b main",
        "git add -A",
        `git -c user.name=starci-next -c user.email=starci-next@users.noreply.invalid commit -q -m ${plan.message}`,
    ]
    const committed = await git.reduce(
        async (ok, command) => (await ok) && (await step(command)).exitCode === 0,
        Promise.resolve(true),
    )
    if (!committed) return failed("git could not make the first commit; is git installed?")
    plan.finish(target)
    return true
}
