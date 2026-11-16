import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { LessonSourceTree } from "@modules/domain/lesson"

/**
 * The port that reads the source tree of a lesson at its pinned content commit: the files of `essentials/<topic>/<lesson>/source/`
 * of the seed repository as the live lesson version holds them, with the public scenarios and invariants. `hidden/` is not part
 * of it. The lesson capability's `LessonSourceTreeService` is the adapter; an object, not a bare function, so a spec doubles it.
 */
export interface McpSourceTree {
    /** The source tree of the live version of a lesson, or null when it is not live or ships no `source/`. */
    tree(lessonId: string): Promise<LessonSourceTree | null>
}

/** Token of the port that reads a lesson source tree. */
export const MCP_SOURCE_TREE: unique symbol = Symbol("domain.mcp.source-tree")

/** Injects the port that reads a lesson source tree. Parameter type: McpSourceTree. */
export const InjectMcpSourceTree = (): TypedParameterDecorator<McpSourceTree> =>
    injector<McpSourceTree>(MCP_SOURCE_TREE)
