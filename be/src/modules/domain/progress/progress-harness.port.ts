import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { HarnessSource, ProgressLocale } from "./progress.contracts"

/**
 * The port through which the progress read model reads the harness (builds, doctor, trials); the app binds the harness
 * capability when it is composed. The shapes follow the harness contract (harnessBuilds, harnessDoctor, harnessTrials).
 */
export interface ProgressHarnessPort {
    /** What the harness holds for a learner, worded in a locale. */
    read(learnerId: string, locale: ProgressLocale): Promise<HarnessSource>
}

/** Token of the harness port. */
export const PROGRESS_HARNESS: unique symbol = Symbol("domain.progress.harness")

/** Injects the harness port. Parameter type: ProgressHarnessPort. */
export const InjectProgressHarness = (): TypedParameterDecorator<ProgressHarnessPort> =>
    injector<ProgressHarnessPort>(PROGRESS_HARNESS)
