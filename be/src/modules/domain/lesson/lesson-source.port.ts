import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { LessonSourceFile } from "./lesson-import.contracts"
import type { LessonTopicModule, LessonTopicStep } from "./lesson-topic.contracts"

/**
 * The port that reads concept folders from a directory. An object, not a bare function, so a unit spec doubles it with
 * `mock<LessonSourceReader>()`.
 */
export interface LessonSourceReader {
    /** Lists the folder names directly below `directory`, sorted by name. */
    folders(directory: string): Promise<ReadonlyArray<string>>
    /** Reads every file below the folder `folder` of `directory`, with the hash of its raw bytes, sorted by path. */
    read(directory: string, folder: string): Promise<ReadonlyArray<LessonSourceFile>>
    /**
     * Reads the content folders of one V1 course module in the teacher's order, from the courses/ folder beside the concepts
     * folder, with their titles; a module the checkout does not hold answers no row.
     */
    modules(directory: string, source: LessonTopicModule): Promise<ReadonlyArray<LessonTopicStep>>
}

/** Token of the port that reads concept folders. */
export const LESSON_SOURCE: unique symbol = Symbol("domain.lesson.source")

/** Injects the port that reads concept folders. Parameter type: LessonSourceReader. */
export const InjectLessonSource = (): TypedParameterDecorator<LessonSourceReader> =>
    injector<LessonSourceReader>(LESSON_SOURCE)
