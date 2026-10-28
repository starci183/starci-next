import { CommandRunner, Option, SubCommand } from "nest-commander"
import { InjectLessonContentService, LessonContentService } from "@modules/domain/lesson-content"

/** The options of `cli lessons import`. */
export interface LessonsImportOptions {
    /** The fixture directory that holds the versioned manifest and its original files. */
    readonly fixture?: string
}

@SubCommand({
    name: "import",
    description: "Import one versioned Academy lesson snapshot into the lesson content store",
})
/** `cli lessons import [--fixture <dir>]`: imports the snapshot and logs its counts, version and hashes — never answer keys. */
export class ImportLessonsCli extends CommandRunner {
    constructor(@InjectLessonContentService() private readonly lessons: LessonContentService) {
        super()
    }

    /** `--fixture <dir>`: the fixture directory that holds `manifest.json` and its referenced original files. */
    @Option({
        flags: "--fixture <dir>",
        description: "The fixture directory that holds the versioned manifest and its original files",
    })
    parseFixture(value: string): string {
        return value
    }

    /** Imports the snapshot of the named fixture directory through the lesson-content capability. */
    async run(_passed: Array<string>, options?: LessonsImportOptions): Promise<void> {
        await this.lessons.importLessons({ fixtureDir: options?.fixture })
    }
}
