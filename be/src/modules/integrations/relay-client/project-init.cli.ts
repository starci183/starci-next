import { join } from "node:path"
import type { CliIo } from "./relay-client.contracts"
import type { InitOptions } from "./relay-client.port"
import {
    copyKit,
    folderExists,
    namesIn,
    readFileOrNull,
    readProjectFile,
    writeProjectFile,
} from "./project-kit.adapter"
import {
    KIT_LANGUAGES,
    ciTemplateOf,
    languageOfFiles,
    milestoneOfCatalog,
    projectIdValid,
    withIdentity,
} from "./project-kit.policy"

/** The folder of the kit in a starci-next-data checkout: `raw/projects/kit` once content is authored under raw/, else `projects/kit`. */
const kitFolderOf = (data: string): string | null =>
    [join(data, "raw", "projects", "kit"), join(data, "projects", "kit")].find((candidate) =>
        folderExists(join(candidate, "starci")),
    ) ?? null

/**
 * `starci-next init <project> [--from <dir>] [--language <l>] [--milestone <id>] [--force]` in a project folder: copies the kit's
 * `starci/` folder (the e2e flows of the current milestone only) and the CI workflow of the language into it, and writes the project id
 * and language into `starci/project.yaml`. The language is detected from the folder (go.mod, pom.xml, a .csproj, package.json) when
 * `--language` is not given; the milestone is the first one of the app kind unless `--milestone` names another. The kit is read from a
 * starci-next-data checkout (`--from`, or `STARCI_NEXT_DATA_DIR`); StarCi does not serve it yet.
 */
export const initProject = (io: CliIo, options: InitOptions, cwd: string): number => {
    const language = options.language ?? languageOfFiles(namesIn(cwd)) ?? "typescript"
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
        io.err(
            "Pass --from <a starci-next-data checkout> (or set STARCI_NEXT_DATA_DIR): StarCi does not serve the kit yet.",
        )
        return 1
    }
    const kitDir = kitFolderOf(data)
    if (kitDir === null) {
        io.err(`No kit at ${join(data, "projects", "kit")}.`)
        return 1
    }
    const catalog = readFileOrNull(join(kitDir, "..", "catalog.yaml"))
    const milestone = catalog === null ? null : milestoneOfCatalog(catalog, options.milestone ?? null)
    if (options.milestone !== undefined && catalog !== null && milestone === null) {
        io.err(`No milestone ${options.milestone} in the catalog.`)
        return 1
    }
    const copy = copyKit(kitDir, cwd, ci, options.force, milestone === null ? null : new Set(milestone.concepts))
    const yaml = readProjectFile(cwd, "starci/project.yaml")
    if (yaml !== null && (copy.written.includes("starci/project.yaml") || options.project !== undefined))
        writeProjectFile(cwd, "starci/project.yaml", withIdentity(yaml, options.project ?? null, language))
    io.out(`Language ${language}${milestone === null ? "" : `, milestone ${milestone.id}`}.`)
    copy.written.forEach((path) => io.out(`  wrote ${path}`))
    copy.kept.forEach((path) => io.out(`  kept ${path} (already there; --force replaces it)`))
    io.out(
        "Next: fix test.command, start and endpoints in starci/project.yaml, tag tests with [concept], then run starci-next run <milestone>.",
    )
    return 0
}
