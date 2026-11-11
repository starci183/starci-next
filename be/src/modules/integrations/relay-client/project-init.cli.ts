import { join } from "node:path"
import type { CliIo } from "./relay-client.contracts"
import type { InitOptions } from "./relay-client.port"
import { copyKit, folderExists, readProjectFile, writeProjectFile } from "./project-kit.adapter"
import { KIT_LANGUAGES, ciTemplateOf, projectIdValid, withIdentity } from "./project-kit.policy"

/**
 * `starci-next init [--from <dir>] [--project <id>] [--language <l>] [--force]` in a project folder: copies the kit's `starci/`
 * folder and the CI template of the language into it, and writes the project id and language into `starci/project.yaml`.
 * The kit is read from a starci-next-data checkout (`--from`, or `STARCI_NEXT_DATA_DIR`); StarCi does not serve it yet.
 */
export const initProject = (io: CliIo, options: InitOptions, cwd: string): number => {
    const language = options.language ?? "typescript"
    const ci = ciTemplateOf(language)
    if (ci === null) {
        io.err(`Unknown language ${language}. Use one of: ${KIT_LANGUAGES.join(", ")}.`)
        return 1
    }
    if (options.project !== undefined && !projectIdValid(options.project)) {
        io.err("The project id is not valid. Copy it from the project page.")
        return 1
    }
    const data = options.from ?? io.env.STARCI_NEXT_DATA_DIR
    if (data === undefined) {
        io.err("Pass --from <a starci-next-data checkout> (or set STARCI_NEXT_DATA_DIR): StarCi does not serve the kit yet.")
        return 1
    }
    const kitDir = join(data, "projects", "kit")
    if (!folderExists(join(kitDir, "starci"))) {
        io.err(`No kit at ${kitDir}.`)
        return 1
    }
    const copy = copyKit(kitDir, cwd, ci, options.force)
    const yaml = readProjectFile(cwd, "starci/project.yaml")
    if (yaml !== null && (copy.written.includes("starci/project.yaml") || options.project !== undefined))
        writeProjectFile(cwd, "starci/project.yaml", withIdentity(yaml, options.project ?? null, language))
    copy.written.forEach((path) => io.out(`  wrote ${path}`))
    copy.kept.forEach((path) => io.out(`  kept ${path} (already there; --force replaces it)`))
    io.out(
        "Next: fix test.command, start and endpoints in starci/project.yaml, tag tests with [concept], then run starci-next run <milestone>.",
    )
    return 0
}
