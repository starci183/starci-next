import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { CareerOptions } from "./career.options"

/** Injection token of the options of the career capability. */
export const CAREER_OPTIONS: unique symbol = Symbol("domain.career.options")

/** Injects the options of the career capability. Parameter type: CareerOptions. */
export const InjectCareerOptions = (): TypedParameterDecorator<CareerOptions> => injector<CareerOptions>(CAREER_OPTIONS)
