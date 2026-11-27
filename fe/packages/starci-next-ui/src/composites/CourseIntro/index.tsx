import { Section, Stack, Text } from "@starci/grammar/common"
import { ArtImage, type ArtAsset } from "../../leaves/Art"
import { TickGlyph } from "../../leaves/Icon"

export { CourseIntroLab } from "./lab"
export type { CourseIntroLabRowView, CourseIntroLabView } from "./lab"

/** One service of the lab as a row: its name and what it does. Drawn by the architecture page (lessons.md §7), not by the intro. */
export type CourseIntroPartView = {
    readonly id: string
    readonly title: string
    readonly description: string
}

/**
 * The interview scene the page opens with: the moment, the setup, the question the learner would fail today (the interviewer's own words),
 * where the learner stumbles and what the lesson promises. Every line comes from the lesson's record.
 */
export type CourseIntroHookView = {
    readonly when: string
    readonly setup: string
    readonly question: string
    readonly stumble: string
    readonly promise: string
}

/** One thing the learner can do after the lesson, with the case that teaches it; the case line is empty when the line itself is the case's title. */
export type CourseIntroOutcomeView = {
    readonly id: string
    readonly can: string
    readonly caseTitle: string
}

/**
 * What the intro page draws: the explainer, the interview hook and what the learner will do. The record also carries the architecture as
 * Mermaid text, its services and what to know first: those belong to the architecture page (lessons.md §7, after the setup and before the
 * failures), so the intro leaves them unread and the view keeps them for that page.
 */
export type CourseIntroView = {
    /** The concept's explainer (the labelled diagram poster) and what it says; undefined for a concept that has none yet. */
    readonly explainer: { readonly asset: ArtAsset; readonly base: string; readonly alt: string } | undefined
    /** The scene the lesson opens with; undefined for a lesson whose record has none. */
    readonly hook: CourseIntroHookView | undefined
    /** What the learner will be able to do, one line each, ticked. */
    readonly outcomes: ReadonlyArray<CourseIntroOutcomeView>
    /** The Mermaid flowchart of the lab, built from the lesson record; a node names its technology with `R@{ icon: "redis" }`. For the architecture page. */
    readonly diagram: string
    /** The services of the lab, one row each. For the architecture page. */
    readonly services: ReadonlyArray<CourseIntroPartView>
    /** The terms the learner should already know. For the architecture page. */
    readonly requires: ReadonlyArray<string>
}

/**
 * The words of the intro page. The architecture words (the diagram, its legend, the services, what to know first) are resolved with them
 * and kept here for the architecture page; the intro itself reads only `outcomesTitle` and `empty`.
 */
export type CourseIntroLabels = {
    readonly architectureTitle: string
    readonly diagramLabel: string
    readonly diagramError: string
    readonly diagramCaption: string
    /** The legend chip of the drawing: a call, a service's own data, the node the learner edits; and the word between two nodes in its text version. */
    readonly diagramCalls: string
    readonly diagramData: string
    readonly diagramEdit: string
    readonly diagramTo: string
    readonly servicesTitle: string
    readonly outcomesTitle: string
    readonly requiresTitle: string
    readonly requiresNote: string
    readonly empty: string
}

/** What the intro page needs. */
type CourseIntroProps = {
    readonly view: CourseIntroView
    readonly labels: CourseIntroLabels
    readonly isLoading?: boolean
}

/**
 * The interview scene: the moment in a muted line, the setup, the interviewer's question as the one big line of the page, then where the
 * learner stumbles and what the lesson promises.
 */
const Hook = (props: { readonly hook: CourseIntroHookView }) => (
    <Stack gap="section">
        <Text as="p" tone="muted">
            {props.hook.when}
        </Text>
        <Text as="p" role="reading.body">
            {props.hook.setup}
        </Text>
        <Text as="p" role="reading.title">
            {`“${props.hook.question}”`}
        </Text>
        <Text as="p" role="reading.body">
            {props.hook.stumble}
        </Text>
        <Text as="p" role="reading.body" tone="muted">
            {props.hook.promise}
        </Text>
    </Stack>
)

/**
 * The intro page of a lab, the main column of the split page (the lab card stands in the rail): the explainer, then the interview question
 * it will let the learner answer, then what they will be able to do, one ticked line per case. Each tick is a Grammar `IconTile`, the green
 * done plate with its check (lessons.md §7: a ticked list never draws a bare check glyph).
 */
export const CourseIntro = (props: CourseIntroProps) => {
    const { view, labels } = props
    return (
        <Stack gap="region" measure="reading">
            {view.explainer === undefined ? null : (
                <ArtImage asset={view.explainer.asset} base={view.explainer.base} alt={view.explainer.alt} />
            )}
            {view.hook === undefined ? null : <Hook hook={view.hook} />}
            <Section
                kind="list"
                title={labels.outcomesTitle}
                headingLevel={2}
                isLoading={props.isLoading === true}
                empty={labels.empty}
                items={view.outcomes.map((line) => ({
                    id: line.id,
                    title: line.can,
                    // The row's leading IconTile: the check on the done plate, the one tick of a "you will be able to" line.
                    leading: { icon: TickGlyph, state: "done" as const },
                    ...(line.caseTitle === "" ? {} : { description: line.caseTitle }),
                }))}
            />
        </Stack>
    )
}
