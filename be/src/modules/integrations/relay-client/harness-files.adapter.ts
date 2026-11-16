import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { HarnessState } from "./harness.contracts"
import { envNamesIn, harnessStateOf } from "./harness.policy"
import { jsonOf } from "./json.mapper"

/** The marker `harness pull` leaves in the build folder; tracked in git so a CI run can read the plan without a device. */
export const HARNESS_STATE_FILE = ".starci-harness.json"

/** The learner's key file: only the variable NAMES in it are ever read. */
const ENV_FILE = ".env"

/** The state `pull` wrote in a folder, or null. */
export const readHarnessState = (folder: string): HarnessState | null => {
    const path = join(folder, HARNESS_STATE_FILE)
    if (!existsSync(path)) return null
    const read = jsonOf(readFileSync(path, "utf8"))
    return read.kind === "read" ? harnessStateOf(read.value) : null
}

/** Writes the state in the build folder. */
export const writeHarnessState = (folder: string, state: HarnessState): void => {
    writeFileSync(join(folder, HARNESS_STATE_FILE), `${JSON.stringify(state, null, 2)}\n`, "utf8")
}

/** The build folder of a build: the current folder when it holds the marker of that build, else `./<build>`; null when neither does. */
export const harnessRootOf = (cwd: string, buildId: string): string | null =>
    [cwd, join(cwd, buildId)].find((folder) => readHarnessState(folder)?.buildId === buildId) ?? null

/**
 * The variable names the folder's `.env` defines. The file is read to find names only: no value is kept, returned, logged or
 * uploaded; the lines that define nothing are dropped.
 */
export const envFileNames = (folder: string): ReadonlyArray<string> => {
    const path = join(folder, ENV_FILE)
    return existsSync(path) ? envNamesIn(readFileSync(path, "utf8")) : []
}

/** Makes sure `.env` is in the folder's `.gitignore` before the first commit, so the learner's keys can never be pushed. */
export const ignoreEnvFile = (folder: string): void => {
    const path = join(folder, ".gitignore")
    const text = existsSync(path) ? readFileSync(path, "utf8") : ""
    if (text.split(/\r?\n/u).some((line) => /^\/?\.env\*?$/u.test(line.trim()))) return
    appendFileSync(path, `${text === "" || text.endsWith("\n") ? "" : "\n"}.env\n`)
}
