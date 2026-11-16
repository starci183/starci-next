import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { CheckSetFiles } from "./project-check-set.contracts"

/** Where the check set's raw files come from: the active content snapshot, or a directory the environment names. */
export interface ProjectCheckSource {
    /** Reads the files, or answers null when no content is available yet. */
    read(): Promise<CheckSetFiles | null>
}

/** Token of the check source. */
export const PROJECT_CHECK_SOURCE: unique symbol = Symbol("domain.project.check-source")

/** Injects the check source. Parameter type: ProjectCheckSource. */
export const InjectProjectCheckSource = (): TypedParameterDecorator<ProjectCheckSource> =>
    injector<ProjectCheckSource>(PROJECT_CHECK_SOURCE)
