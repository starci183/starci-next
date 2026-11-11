import { Divider, Link, PaneSection, Section, Stack, Text } from "@starci/grammar/common"
import { LockIcon } from "../../leaves/Icon"
import { RowProgress } from "../RowProgress"

/** The words of the aside, resolved by its block. */
export type StudyRailLabels = {
    /** The accessible name of the phase tabs of the lesson page. */
    readonly phases: string
    /** The title of the learning-outcomes section. */
    readonly outcomes: string
    /** What the outcomes section says to a reader whose plan does not track them. */
    readonly outcomesLocked: string
    /** The words of the link to the plans. */
    readonly seePremium: string
    /** The words of an outcome that is not started, understood, or proved in code. */
    readonly outcomeStates: readonly [string, string, string]
    /** The title of the review section. */
    readonly review: string
    readonly empty: string
    /** The accessible name of the lock on what needs Premium. */
    readonly locked: string
    /** The title of the section of references. */
    readonly references: string
    /** The words of a review that falls due after the given number of days. */
    readonly reviewAfter: (days: number) => string
    /** What a review says before the lesson is finished. */
    readonly reviewState: string
    /** The accessible name of the control that closes the aside drawer. */
    readonly close: string
}

/** One review of the lesson, worded by its block: when it falls due and what state it is in. */
type StudyRailReview = { readonly id: string; readonly title: string; readonly state: string }

/** What the aside of a lesson holds: learning outcomes, the reviews that follow and the sources. */
type StudyRailProps = {
    /** One bar per learning outcome, 0 to 100. */
    readonly outcomes: ReadonlyArray<{ readonly id: string; readonly text: string; readonly value: number }>
    /** True when the reader's plan does not track outcomes: the section says so instead of drawing empty bars. */
    readonly isOutcomesLocked: boolean
    /** The destination of the plans page. */
    readonly plansHref: string
    readonly reviews: ReadonlyArray<StudyRailReview>
    /** The sources the lesson cites; a source with no address is listed without a link. */
    readonly references: ReadonlyArray<{ readonly id: string; readonly label: string; readonly href: string }>
    readonly labels: StudyRailLabels
}

/** The state of an outcome in words (12, muted), as the row's own supporting line. */
const stateOf = (value: number, words: StudyRailLabels["outcomeStates"]): string => {
    if (value >= 100) return words[2]
    return value > 0 ? words[1] : words[0]
}

/** The outcomes of the lesson as list rows (Section kind="list" draws them flat inside the aside, 0.37.14), or, for a reader without Premium, the line that says why there are none and the link to the plans. */
const OutcomesSection = (props: Pick<StudyRailProps, "outcomes" | "isOutcomesLocked" | "plansHref" | "labels">) =>
    props.isOutcomesLocked ? (
        <Section title={props.labels.outcomes} headingLevel={2}>
            <Stack gap="inline">
                <Text size="sm" tone="muted" startContent={<LockIcon label={props.labels.locked} />}>
                    {props.labels.outcomesLocked}
                </Text>
                <Link variant="plain" href={props.plansHref}>{props.labels.seePremium}</Link>
            </Stack>
        </Section>
    ) : (
        <Section
            kind="list"
            title={props.labels.outcomes}
            headingLevel={2}
            empty={props.labels.empty}
            items={props.outcomes.map((outcome) => ({
                id: outcome.id,
                title: outcome.text,
                description: stateOf(outcome.value, props.labels.outcomeStates),
                ...(outcome.value > 0
                    ? {
                          detail: (
                              <RowProgress
                                  label={outcome.text}
                                  value={outcome.value}
                                  tone={outcome.value >= 100 ? "success" : "accent"}
                              />
                          ),
                      }
                    : {}),
            }))}
        />
    )

/**
 * The aside of a lesson, on the surface and flat: the learning outcomes, the reviews after 1, 7 and 21 days and the references, as
 * sections divided by hairlines, never as floating cards. It stands inside the `aside` pane of the lesson's grid.
 */
export const StudyRail = (props: StudyRailProps) => (
    <PaneSection gap="section">
        {props.outcomes.length === 0 ? null : (
            <>
                <OutcomesSection
                    outcomes={props.outcomes}
                    isOutcomesLocked={props.isOutcomesLocked}
                    plansHref={props.plansHref}
                    labels={props.labels}
                />
                <Divider semantics="presentation" />
            </>
        )}
        <Section
            kind="list"
            title={props.labels.review}
            headingLevel={2}
            empty={props.labels.empty}
            items={props.reviews.map((review) => ({ id: review.id, title: review.title, meta: { text: review.state } }))}
        />
        {props.references.length === 0 ? null : (
            <>
                <Divider semantics="presentation" />
                <Section title={props.labels.references} headingLevel={2}>
                    <Stack gap="inline">
                        {props.references.map((reference) =>
                            reference.href === "" ? (
                                <Text key={reference.id}>{reference.label}</Text>
                            ) : (
                                <Link variant="plain" key={reference.id} href={reference.href} kind="external">
                                    {reference.label}
                                </Link>
                            ),
                        )}
                    </Stack>
                </Section>
            </>
        )}
    </PaneSection>
)
