import { createHash } from "node:crypto"
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { Injectable } from "@nestjs/common"
import type { CheckSetFiles } from "./project-check-set.contracts"
import type { ProjectCheckSource } from "./project-check-set.port"
import { InjectProjectOptions } from "./project.decorators"
import type { ProjectOptions } from "./project.options"

/** The folder of the check set inside a content checkout. */
const CHECKS_FOLDER = join("raw", "projects")

const readText = (path: string): Promise<string | null> =>
    readFile(path, "utf8").then(
        (text) => text,
        () => null,
    )

@Injectable()
/**
 * Reads the check set from a content checkout on disk: the directory `PROJECT_CHECKS_DIR` names, the checkout a developer authors
 * against. The version is a hash of the files. The seed standard reaches the app through the database instead
 * (`ProjectCheckSetStoreAdapter`), never through a checkout the api finds on its own.
 */
export class ProjectCheckSetDiskAdapter implements ProjectCheckSource {
    constructor(@InjectProjectOptions() private readonly options: ProjectOptions) {}

    /** Reads catalog.yaml and every probe file, or answers null when no checkout is named or it holds no catalog. */
    async read(): Promise<CheckSetFiles | null> {
        if (this.options.checksDir === undefined) return null
        const folder = join(this.options.checksDir, CHECKS_FOLDER)
        const catalog = await readText(join(folder, "catalog.yaml"))
        if (catalog === null) return null
        const names = (await readdir(join(folder, "probes")).catch(() => [] as Array<string>)).filter((name) =>
            name.endsWith(".yaml"),
        )
        const texts = await Promise.all(names.map((name) => readText(join(folder, "probes", name))))
        const probes = Object.fromEntries(names.map((name, index) => [name, texts[index] ?? ""]))
        const version = createHash("sha256").update(catalog).update(JSON.stringify(probes)).digest("hex").slice(0, 12)
        return { version, catalog, probes }
    }
}
