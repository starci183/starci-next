import { Injectable } from "@nestjs/common"
import { HARNESS_LOCALES, HarnessReadService } from "@modules/domain/harness"
import type { McpHarnessFile } from "./mcp-harness.policy"
import type { McpHarnessSource } from "./mcp-harness-source.port"

/** A section as the page shows it, written as markdown with its copy-run block. */
const sectionOf = (section: {
    readonly title: string
    readonly body: string
    readonly run: ReadonlyArray<string>
}): string =>
    [`## ${section.title}`, section.body, section.run.length === 0 ? "" : `\`\`\`sh\n${section.run.join("\n")}\n\`\`\``]
        .filter((part) => part.trim() !== "")
        .join("\n\n")

/** A guide or doc as one markdown text: its title, its summary and its sections. */
const textOf = (page: {
    readonly title: string
    readonly summary: string
    readonly sections: ReadonlyArray<{
        readonly title: string
        readonly body: string
        readonly run: ReadonlyArray<string>
    }>
}): string =>
    [`# ${page.title}`, page.summary, ...page.sections.map(sectionOf)].filter((part) => part.trim() !== "").join("\n\n")

@Injectable()
/**
 * Reads the harness guides and docs from the store the seed loader fills (`HarnessReadService`, the same reads the /harness pages
 * make). Only guides and docs are asked for, so a build kit, a hidden part, a doctor probe or a trial trap is never listed, searched
 * or embedded; each page becomes the file the policy expects (`harness/guides/<tool>/<slug>/<locale>.md`).
 */
export class McpHarnessStoreSource implements McpHarnessSource {
    constructor(private readonly harness: HarnessReadService) {}

    /** Every guide and doc in both locales as a markdown file. */
    async files(): Promise<ReadonlyArray<McpHarnessFile>> {
        const files: Array<McpHarnessFile> = []
        for (const locale of HARNESS_LOCALES)
            for (const page of await this.harness.pages(locale))
                files.push({
                    path:
                        page.kind === "guide"
                            ? `harness/guides/${page.tool ?? ""}/${page.slug}/${locale}.md`
                            : `harness/docs/${page.slug}/${locale}.md`,
                    text: textOf(page),
                })
        return files
    }
}
