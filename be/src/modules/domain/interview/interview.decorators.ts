import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { InterviewSettings } from "./interview.options"

/** Injection token of the resolved interview settings. */
export const INTERVIEW_RESOLVED_OPTIONS: unique symbol = Symbol("domain.interview.resolved-options")

/** Injects the resolved interview settings. Parameter type: InterviewSettings. */
export const InjectInterviewResolvedOptions = (): TypedParameterDecorator<InterviewSettings> =>
    injector<InterviewSettings>(INTERVIEW_RESOLVED_OPTIONS)

/** Injection token of the options of the interview capability. */
export const INTERVIEW_OPTIONS: unique symbol = Symbol("domain.interview.options")
