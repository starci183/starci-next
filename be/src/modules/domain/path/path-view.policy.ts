import type { MessageBundle } from "@modules/platform/i18n"
import { PATH_COPY } from "./messages/path.messages"
import {
    PATH_PARTS,
    PATH_STAGES,
    type PathActive,
    type PathDefinition,
    type PathLocale,
    type PathPart,
    type PathStageView,
    type PathStepView,
    type PathView,
} from "./path.contracts"

/** The most next steps the path card on the hub lists. */
export const PATH_NEXT_STEPS = 3

/** Where each part lives in the app. */
export const PATH_PART_ROUTES: Readonly<Record<PathPart, string>> = {
    essentials: "/essentials",
    review: "/review",
    practice: "/practice",
    projects: "/projects",
    interview: "/interview",
    profile: "/profile",
}

/** The text of a key in a locale, read from `messages`; a key it does not have shows as itself, so a gap is visible and never blank. */
export const keyedText = (messages: MessageBundle, key: string, locale: PathLocale): string =>
    messages[locale][key] ?? key

const textOf = (key: string, locale: PathLocale): string => keyedText(PATH_COPY, key, locale)

const stagesOf = (definition: PathDefinition, locale: PathLocale): Array<PathStageView> =>
    PATH_STAGES.map((stageId) => ({
        stageId,
        title: textOf(`stage.${stageId}`, locale),
        steps: definition.steps
            .filter((step) => step.stage === stageId)
            .map((step): PathStepView => ({
                stepId: step.id,
                part: step.part,
                title: step.title[locale],
                link: PATH_PART_ROUTES[step.part],
            })),
    })).filter((stage) => stage.steps.length > 0)

/** One path as a screen reads it, in the asked locale. */
export const viewOf = (definition: PathDefinition, locale: PathLocale): PathView => ({
    pathId: definition.id,
    kind: definition.kind,
    title: definition.title[locale],
    pitch: definition.pitch[locale],
    done: definition.done[locale],
    checks: definition.checks.map((check) => ({ text: check.text[locale], selfReported: check.selfReported })),
    weeks: definition.weeks,
    stepCount: definition.steps.length,
    parts: PATH_PARTS.filter((part) => definition.steps.some((step) => step.part === part)).map((part) => ({
        part,
        label: textOf(`part.${part}`, locale),
    })),
    stages: stagesOf(definition, locale),
})

/** The path a learner follows with its next steps; no step state exists yet, so these are the first steps in order. */
export const activeOf = (definition: PathDefinition, locale: PathLocale): PathActive => ({
    pathId: definition.id,
    title: definition.title[locale],
    next: definition.steps.slice(0, PATH_NEXT_STEPS).map((step) => step.title[locale]),
})
