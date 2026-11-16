import { createHash } from "node:crypto"
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { Injectable } from "@nestjs/common"
import { isRecord } from "@modules/platform/primitives"
import type { CheckSetFiles } from "./project-check-set.contracts"
import type { ProjectCheckSource } from "./project-check-set.port"
import { InjectProjectOptions } from "./project.decorators"
import type { ProjectOptions } from "./project.options"

/** The folder of the check set inside a content checkout or snapshot. */
const CHECKS_FOLDER = join("raw", "projects")

const readText = (path: string): Promise<string | null> =>
    readFile(path, "utf8").then(
        (text) => text,
        () => null,
    )

@Injectable()
/**
 * Reads the check set from disk: `PROJECT_CHECKS_DIR` (a content checkout, for development) when set, else the content snapshot
 * `active.json` under `CONTENT_DATASOURCES_DIR` names. The version is the snapshot sha, or a hash of the files for a checkout.
 */
export class ProjectCheckSetDiskAdapter implements ProjectCheckSource {
    constructor(@InjectProjectOptions() private readonly options: ProjectOptions) {}

    /** Reads catalog.yaml and every probe file, or answers null when there is no content yet. */
    async read(): Promise<CheckSetFiles | null> {
        const located = await this.locate()
        if (located === null) return null
        const folder = join(located.root, CHECKS_FOLDER)
        const catalog = await readText(join(folder, "catalog.yaml"))
        if (catalog === null) return null
        const names = (await readdir(join(folder, "probes")).catch(() => [] as Array<string>)).filter((name) =>
            name.endsWith(".yaml"),
        )
        const texts = await Promise.all(names.map((name) => readText(join(folder, "probes", name))))
        const probes = Object.fromEntries(names.map((name, index) => [name, texts[index] ?? ""]))
        const version =
            located.sha ??
            createHash("sha256").update(catalog).update(JSON.stringify(probes)).digest("hex").slice(0, 12)
        return { version, catalog, probes }
    }

    private async locate(): Promise<{ root: string; sha: string | null } | null> {
        if (this.options.checksDir !== undefined) return { root: this.options.checksDir, sha: null }
        if (this.options.datasourcesDir === undefined) return null
        const active = await readText(join(this.options.datasourcesDir, "active.json"))
        if (active === null) return null
        const parsed: unknown = JSON.parse(active)
        const content = isRecord(parsed) ? parsed["content"] : undefined
        if (!isRecord(content) || typeof content["directory"] !== "string" || typeof content["sha"] !== "string")
            return null
        return { root: content["directory"], sha: content["sha"] }
    }
}
