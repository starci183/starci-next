import { Cluster, IconTile, Section, Stack, Text } from "@starci/grammar/common"
import { ArtImage, type ArtAsset } from "../../leaves/Art"
import { ITEM_TILE } from "../../leaves/Icon"
import {
    InterviewerQuote,
    NarrationText,
    Narrator,
    narrationTermsOf,
    type NarrationTerm,
    type NarratorView,
} from "../Narration"

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
 * where the learner stumbles and what the lesson promises. Every line comes from the lesson's record; setup, stumble and promise are the
 * mentor's narration (inline markdown, lessons.md §9), the question is a quote (plain).
 */
export type CourseIntroHookView = {
    readonly setup: string
    /** Who asks, as the source of the question's Quote: the mentor himself ("Thầy StarCi · CTO nivo.vn"). */
    readonly asker: string
    readonly question: string
    /** The mentor pressing back on the learner-candidate's naive answer, a plain quote; empty when the record has none. */
    readonly pushback: string
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
    /** What the learner will be able to do, one line each, ticked; each line is narration (inline markdown). */
    readonly outcomes: ReadonlyArray<CourseIntroOutcomeView>
    /** The narration's keywords and their notes, in the reader's language (lessons.md §9). */
    readonly terms: ReadonlyArray<NarrationTerm>
    /** The mentor who narrates: his photo and label. */
    readonly narrator: NarratorView
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

/** What the interview scene needs: the hook, the narration's keywords and the mentor who narrates it. */
type HookProps = {
    readonly hook: CourseIntroHookView
    readonly terms: ReadonlyArray<NarrationTerm>
    readonly narrator: NarratorView
}

/**
 * The interview scene, told and asked by one person (owner 2026-11-28: "là thầy hỏi đó"): the mentor's header (photo and label) once, then
 * the setup, his question as a Grammar `Quote` (source "Thầy StarCi · CTO nivo.vn", no second avatar, no moment of the interview), then
 * where the learner stumbles and what the lesson promises. The scene is one section: a keyword is marked where it first stands in it.
 */
const Hook = (props: HookProps) => {
    const { hook } = props
    const [setup, stumble, promise] = narrationTermsOf([hook.setup, hook.stumble, hook.promise], props.terms)
    return (
        <Stack gap="section">
            <Narrator narrator={props.narrator}>
                <Text as="p" role="reading.body">
                    <NarrationText text={hook.setup} {...(setup === undefined ? {} : { terms: setup })} />
                </Text>
                <InterviewerQuote quote={hook.question} />
                <Text as="p" role="reading.body">
                    <NarrationText text={hook.stumble} {...(stumble === undefined ? {} : { terms: stumble })} />
                </Text>
                {/* The mentor presses back on the naive answer (owner 2026-11-28: "ghi rõ thầy sấy đi!!"): his own words, the same Quote. */}
                {hook.pushback === "" ? null : <InterviewerQuote quote={hook.pushback} />}
                <Text as="p" role="reading.body" tone="muted">
                    <NarrationText text={hook.promise} {...(promise === undefined ? {} : { terms: promise })} />
                </Text>
            </Narrator>
        </Stack>
    )
}

/**
 * The intro page of a lab, the main column of the split page (the lab card stands in the rail): the explainer, then the interview question
 * it will let the learner answer, then what they will be able to do, one ticked line per case. Each tick is a Grammar `IconTile`, the green
 * done plate with its check (lessons.md §7: a ticked list never draws a bare check glyph).
 */
export const CourseIntro = (props: CourseIntroProps) => {
    const { view, labels } = props
    // The ticked lines are their own section: a keyword is marked again where it first stands among them.
    const outcomeTerms = narrationTermsOf(
        view.outcomes.map((line) => line.can),
        view.terms,
    )
    return (
        // The main column of a split page (owner 2026-11-28: "responsive ở giữa, bên phải dính bên phải"): the reading measure keeps the text
        // readable and centres it in the grid's fluid track, while the rail stays pinned to the right edge.
        <Stack gap="region" measure="reading">
            {view.explainer === undefined ? null : (
                <ArtImage asset={view.explainer.asset} base={view.explainer.base} alt={view.explainer.alt} />
            )}
            {view.hook === undefined ? null : <Hook hook={view.hook} terms={view.terms} narrator={view.narrator} />}
            {/* What the learner will be able to do (owner 2026-11-28): numbered lines of content, each led by the round 24 with its number, the
                case that teaches it muted under it. */}
            <Section title={labels.outcomesTitle} headingLevel={2} isLoading={props.isLoading === true}>
                <Stack gap="row">
                    {view.outcomes.map((line, index) => (
                        <Cluster key={line.id} gap="inline" align="start" wrap={false}>
                            <IconTile step={index + 1} tone="accent" {...ITEM_TILE} />
                            <Stack gap="identity">
                                <Text as="p">
                                    <NarrationText text={line.can} terms={outcomeTerms[index] ?? []} />
                                </Text>
                                {line.caseTitle === "" ? null : (
                                    <Text as="p" role="caption" tone="muted">
                                        {line.caseTitle}
                                    </Text>
                                )}
                            </Stack>
                        </Cluster>
                    ))}
                </Stack>
            </Section>
        </Stack>
    )
}
