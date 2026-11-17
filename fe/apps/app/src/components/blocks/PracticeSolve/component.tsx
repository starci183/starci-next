import { Alert, Grid, Page, Stack } from "@starci/grammar/common"
import {
    LockedNotice,
    PracticeEditor,
    PracticeHints,
    PracticeList,
    PracticeProblemPanel,
    PracticeResult,
    SlotView,
    type MarkdownBlock,
    type PracticeEditorLabels,
    type PracticeExample,
    type PracticeHintsLabels,
    type PracticeHintItem,
    type PracticeLanguageOption,
    type PracticeProblemLabels,
    type PracticeResultLabels,
    type PracticeResultState,
    type PracticeRow,
} from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** Why the last run, submission or hint did not go through; `none` when it did. */
export type PracticeSolveIssue = "none" | "locked" | "rateLimited" | "other"

/** The solve screen as it is drawn: every word is already resolved. */
export type PracticeSolveView = {
    readonly title: string
    readonly patternTitle: string
    readonly patternHref: string
    readonly eyebrow: string
    readonly difficulty: string
    readonly difficultyTone: "success" | "warning" | "danger" | "neutral"
    readonly facts: ReadonlyArray<string>
    readonly blocks: ReadonlyArray<MarkdownBlock>
    readonly examples: ReadonlyArray<PracticeExample>
    readonly isLocked: boolean
    readonly hintsTotal: number
    /** The other problems of the pattern, the current one marked. */
    readonly rail: ReadonlyArray<PracticeRow>
}

/** The fake problem with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const PRACTICE_SOLVE_PLACEHOLDER: PracticeSolveView = {
    title: "xxxxxxxxxx",
    patternTitle: "xxxxxx",
    patternHref: "/",
    eyebrow: "xxxxxx",
    difficulty: "xxxxxx",
    difficultyTone: "neutral",
    facts: ["xxxxxx", "xxxxxxxx"],
    blocks: [],
    examples: [],
    isLocked: false,
    hintsTotal: 3,
    rail: [1, 2, 3].map((index) => ({
        id: `placeholder-${index}`,
        title: "xxxxxxxxxx",
        description: "xxxxxxxx",
        badge: "xxxxxx",
        badgeTone: "muted",
        href: "/",
        cta: "xxxx",
        isCurrent: false,
    })),
}

/** The fixed words of the solve screen. */
export type PracticeSolveLabels = {
    readonly breadcrumbs: string
    readonly catalog: string
    readonly rail: string
    readonly railEmpty: string
    readonly problem: PracticeProblemLabels
    readonly editor: PracticeEditorLabels
    readonly hints: PracticeHintsLabels
    readonly result: PracticeResultLabels
    readonly locked: { readonly title: string; readonly description: string; readonly plans: string }
    readonly rateLimited: string
    readonly failed: string
    readonly hintLocked: string
    readonly hintFailed: string
}

/** What the learner holds and the last judge answer, ready to draw. */
export type PracticeSolveState = {
    readonly languages: ReadonlyArray<PracticeLanguageOption>
    readonly language: string
    readonly code: string
    readonly issue: PracticeSolveIssue
    readonly result: PracticeResultState
    readonly hints: ReadonlyArray<PracticeHintItem>
    readonly hintIssue: PracticeSolveIssue
}

/** What the learner does on the screen. */
type PracticeSolveActions = {
    readonly retry: () => void
    readonly language: (language: string) => void
    readonly write: (code: string) => void
    readonly reset: () => void
    readonly run: () => void
    readonly submit: () => void
    readonly reveal: () => void
}

/** Props for {@link PracticeSolveBase}. */
export type PracticeSolveBaseProps = {
    readonly props: {
        readonly slot: DataSlot<PracticeSolveView>
        readonly placeholder: PracticeSolveView
        readonly slotLabels: SlotLabels
        readonly labels: PracticeSolveLabels
        readonly state: PracticeSolveState
        /** True while a run or a submission is in flight. */
        readonly isBusy: boolean
        /** True while a hint is being opened. */
        readonly isRevealing: boolean
        readonly catalogHref: string
        readonly plansHref: string
    }
    readonly on: PracticeSolveActions
}

/** What a body part needs of the screen. */
type BodyProps = {
    readonly view: PracticeSolveView
    readonly isLoading: boolean
    readonly props: PracticeSolveBaseProps["props"]
    readonly on: PracticeSolveActions
}

/** What a notice needs: the issue and the words. */
type NoticeProps = { readonly issue: PracticeSolveIssue; readonly labels: PracticeSolveLabels }

/** The notice of a run or submission the door refused: a wait for the rate limit, else a plain failure; nothing when it went through. */
const IssueNotice = (props: NoticeProps) => {
    if (props.issue === "none" || props.issue === "locked") return null
    return (
        <Alert
            tone={props.issue === "rateLimited" ? "cautionary" : "negative"}
            title={props.issue === "rateLimited" ? props.labels.rateLimited : props.labels.failed}
        />
    )
}

/** The notice of a hint the door refused. */
const HintNotice = (props: NoticeProps) => {
    if (props.issue === "none") return null
    return (
        <Alert
            tone={props.issue === "other" ? "negative" : "cautionary"}
            title={props.issue === "other" ? props.labels.hintFailed : props.labels.hintLocked}
        />
    )
}

/** The primary column: the statement, then either the Premium upsell or the editor, the hint ladder and the result. */
const SolveMain = (props: BodyProps) => {
    const { view, props: p } = props
    const isLocked = view.isLocked || p.state.issue === "locked"
    return (
        <Stack gap="region">
            <PracticeProblemPanel
                eyebrow={view.eyebrow}
                title={view.title}
                difficulty={view.difficulty}
                difficultyTone={view.difficultyTone}
                facts={view.facts}
                blocks={view.blocks}
                examples={view.examples}
                labels={p.labels.problem}
                isLoading={props.isLoading}
            />
            {isLocked ? (
                <LockedNotice
                    title={p.labels.locked.title}
                    description={p.labels.locked.description}
                    plansLabel={p.labels.locked.plans}
                    plansHref={p.plansHref}
                />
            ) : (
                <>
                    <PracticeEditor
                        labels={p.labels.editor}
                        languages={p.state.languages}
                        language={p.state.language}
                        value={p.state.code}
                        isBusy={p.isBusy}
                        isDisabled={p.state.code.trim() === "" || props.isLoading}
                        onLanguage={props.on.language}
                        onChange={props.on.write}
                        onReset={props.on.reset}
                        onRun={props.on.run}
                        onSubmit={props.on.submit}
                    />
                    <IssueNotice issue={p.state.issue} labels={p.labels} />
                    <PracticeResult state={p.state.result} labels={p.labels.result} />
                    <PracticeHints
                        labels={p.labels.hints}
                        total={view.hintsTotal}
                        revealed={p.state.hints}
                        isRevealing={p.isRevealing}
                        isDisabled={props.isLoading}
                        onReveal={props.on.reveal}
                    />
                    <HintNotice issue={p.state.hintIssue} labels={p.labels} />
                </>
            )}
        </Stack>
    )
}

/** Draws the solve screen the way the canvas does: statement, editor, hints and result in the middle, the pattern's problems beside. */
export const PracticeSolveBase = (props: PracticeSolveBaseProps) => {
    const { slot, placeholder, labels } = props.props
    const view = "items" in slot ? slot.items : placeholder
    const hasHeader = "items" in slot || "isLoading" in slot
    return (
        <Page
            {...(hasHeader
                ? {
                      header: {
                          title: view.title,
                          titleScale: "standard" as const,
                          breadcrumbs: {
                              label: labels.breadcrumbs,
                              items: [
                                  { id: "practice", label: labels.catalog, href: props.props.catalogHref },
                                  { id: "pattern", label: view.patternTitle, href: view.patternHref },
                                  { id: "problem", label: view.title },
                              ],
                          },
                      },
                  }
                : {})}
        >
            <SlotView
                slot={slot}
                placeholder={placeholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retry}
                render={(each, isLoading) => (
                    <Grid
                        kind="main-rail"
                        railPosition="trailing"
                        primary={<SolveMain view={each} isLoading={isLoading} props={props.props} on={props.on} />}
                        rail={
                            <PracticeList
                                label={labels.rail}
                                emptyLabel={labels.railEmpty}
                                rows={each.rail}
                                isLoading={isLoading}
                            />
                        }
                    />
                )}
            />
        </Page>
    )
}
