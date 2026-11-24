import {
    Button,
    EmptyNotice,
    ExpandableText,
    Page,
    Pane,
    PaneGrid,
    PaneSection,
    Stack,
    Text,
    type PageHeaderContent,
} from "@starci/grammar/common"
import type { ReactNode } from "react"
import {
    EssentialApply,
    EssentialBugHunt,
    EssentialPattern,
    EssentialReading,
    EssentialScenarios,
    EssentialSource,
    EssentialSourceDownload,
    LessonEnd,
    LessonLockedPart,
    LessonOpener,
    LessonQuestion,
    LessonResult,
    LockIcon,
    SlotView,
    WrittenCard,
} from "@starci-next/ui"
import type { EssentialLessonScreen, EssentialLessonView, EssentialPrimary } from "@/hooks/essentialLesson"
import { LOCKABLE_PARTS } from "@/hooks/essentialLesson"
import { useIsPhone } from "@/hooks/publicCv/useViewport"
import { APP_ROUTES } from "@/modules/routes"

/** What a part is drawn from: the lesson as the screen resolved it, the screen's props and actions, and whether the first read still runs. */
export type PartContext = {
    readonly lesson: EssentialLessonView
    readonly screen: EssentialLessonScreen
    readonly isLoading: boolean
    /** True at phone width: a part that has a side panel folds it above its body instead. */
    readonly isPhone: boolean
    /** The public base of the statics (the opener's pictures and logos). */
    readonly staticsBaseUrl: string
}

/** What one part of the lesson page hands the shell: its body and the one command the page header carries for it (undefined draws none). */
export type PartLayout = {
    readonly main: ReactNode
    readonly action: ReactNode | undefined
}

/** A part builds its layout from the context; the shell never reads a part's data. */
export type PartLayoutOf = (context: PartContext) => PartLayout

/** The one primary command the header carries for a part: grey with its reason beneath when it cannot be pressed. */
export const PrimaryAction = (props: { readonly primary: EssentialPrimary | undefined }) => {
    const { primary } = props
    if (primary === undefined) return undefined
    return (
        <Stack gap="identity">
            <Button
                variant="primary"
                isDisabled={primary.isDisabled}
                isPending={primary.isPending}
                onPress={primary.onPress}
            >
                {primary.label}
            </Button>
            {primary.reason === "" ? null : <Text tone="muted">{primary.reason}</Text>}
        </Stack>
    )
}

/** Copies a text to the clipboard of the learner. */
const copy = (text: string): void => void navigator.clipboard.writeText(text)

/** The five parts in the order of the lesson. */
const PART_ORDER: ReadonlyArray<EssentialLessonView["part"]> = ["essence", ...LOCKABLE_PARTS]

/**
 * Mở đầu: the five questions one at a time, then the result. The result carries its own two commands (answer again, on to Bản chất), so
 * the header carries none.
 */
export const essenceLayout: PartLayoutOf = (context) => {
    const { lesson, screen, isLoading, isPhone } = context
    const { essence } = lesson
    const labels = screen.props.essence
    const on = screen.on
    if (essence.stage === "result" && !isLoading) {
        return {
            main: (
                <LessonResult
                    view={essence}
                    labels={labels}
                    isLoading={isLoading}
                    onRetake={on.retake}
                    onNext={() => on.openPart("source")}
                    onUpgrade={on.openPlans}
                />
            ),
            action: undefined,
        }
    }
    const question = essence.questions[essence.index]
    if (question === undefined) return { main: <EmptyNotice message={labels.opener.empty} />, action: undefined }
    const isLast = essence.index >= essence.questions.length - 1
    return {
        main: (
            <LessonOpener
                view={essence}
                question={question}
                labels={labels}
                isLoading={isLoading}
                isLast={isLast}
                isPhone={isPhone}
                onAnswer={on.answer}
                onCopy={copy}
                onNext={() => (isLast ? on.showStage("result") : on.moveOpener(essence.index + 1))}
                staticsBase={context.staticsBaseUrl}
            />
        ),
        action: undefined,
    }
}

/**
 * Bản chất: the scenario-led reading by chapter with its sticky contents (a chapter bar on a phone), the glossary in the margin, the
 * learner's runs under each flow, a server-graded self-check closing each chapter, and the MCP and lab as compact tools after the first
 * chapter; the header goes on to Tìm sạn. A lesson written before the reading keeps
 * the source part.
 */
export const readingLayout: PartLayoutOf = (context) => {
    const { lesson, screen, isLoading, isPhone } = context
    const reading = lesson.reading
    if (reading === undefined) return sourceLayout(context)
    return {
        main: (
            <EssentialReading
                view={reading}
                labels={screen.props.five.reading}
                isLoading={isLoading}
                isPhone={isPhone}
                onCopy={copy}
                onAnswer={screen.on.answer}
            />
        ),
        action: (
            <Button variant="primary" onPress={() => screen.on.openPart("scenarios")}>
                {screen.props.shell.toBugs}
            </Button>
        ),
    }
}

/** Tìm sạn: the bug pack pulled and run on the learner's machine, every test with its newest result, why it passes or not yet, and its hints one at a time. */
export const bugsLayout: PartLayoutOf = (context) => {
    const { lesson, screen, isLoading } = context
    const hunt = lesson.bugHunt
    if (hunt === undefined) return scenariosLayout(context)
    return {
        main: (
            <EssentialBugHunt
                view={hunt}
                labels={screen.props.five.bugs}
                isLoading={isLoading}
                onCopy={copy}
                onHint={screen.on.openBugHint}
            />
        ),
        action: (
            <Button variant="border" onPress={() => copy(hunt.commands)}>
                {screen.props.shell.copyRun}
            </Button>
        ),
    }
}

/** Pattern: the stack tabs, the three questions, the snippet and the main files; the header opens the folder on GitHub when there is one. Not graded. */
export const patternLayout: PartLayoutOf = (context) => {
    const { lesson, screen, isLoading } = context
    const pattern = lesson.pattern
    if (pattern === undefined) return { main: <EmptyNotice message={screen.props.page.soon} />, action: undefined }
    const { shell } = screen.props
    const stack = pattern.stacks.find((each) => each.id === pattern.selected)
    return {
        main: (
            <Stack gap="region">
                <EssentialPattern
                    part={pattern}
                    labels={screen.props.five.pattern}
                    isLoading={isLoading}
                    onSelect={screen.on.selectStack}
                />
                <Stack gap="inline">
                    <Button variant="border" onPress={screen.on.openEnd}>
                        {shell.toEnd}
                    </Button>
                </Stack>
            </Stack>
        ),
        action:
            pattern.url === "" ? (
                <Stack gap="identity">
                    <Button variant="border" isDisabled>
                        {shell.github}
                    </Button>
                    <Text tone="muted">{shell.githubSoon(stack?.label ?? "")}</Text>
                </Stack>
            ) : (
                <Button variant="border" href={pattern.url}>
                    {shell.github}
                </Button>
            ),
    }
}

/** The written explanation an essence question asks: the box once the question was answered, a line before. */
const WrittenOf = ({ lesson, screen, questionId }: PartContext & { readonly questionId: string }): ReactNode => {
    const written = lesson.written[questionId]
    if (written === undefined) return null
    if (!written.isOpen) return <Text tone="muted">{screen.props.five.writtenWait}</Text>
    return <WrittenBox written={written} screen={screen} />
}

/** The written card of one explanation. */
const WrittenBox = (props: {
    readonly written: NonNullable<EssentialLessonView["written"][string]>
    readonly screen: EssentialLessonScreen
}) => (
    <WrittenCard
        prompt={props.written.prompt}
        criteria={[]}
        instructions=""
        draft={props.written.draft}
        labels={props.screen.props.written}
        plansHref={props.screen.props.plansHref}
        onChange={(text) => props.screen.on.write(props.written.activityId, text)}
        onSubmit={() => props.screen.on.submitWritten(props.written.activityId)}
    />
)

/** Source: the machine and the pull commands, the architecture, the rule each component keeps and the code walk; the archive is the primary. */
export const sourceLayout: PartLayoutOf = ({ lesson, screen, isLoading }) => {
    const { labels } = screen.props.runs
    return {
        main: <EssentialSource source={lesson.source} labels={labels.source} isLoading={isLoading} onCopy={copy} />,
        action: <EssentialSourceDownload href={lesson.source.downloadHref} label={labels.primary.download} />,
    }
}

/** Kịch bản: the scenarios run on the learner's machine; the primary is run, check again or the next scenario. */
export const scenariosLayout: PartLayoutOf = ({ lesson, screen, isLoading }) => {
    const { labels, primary } = screen.props.runs
    return {
        main: (
            <EssentialScenarios
                part={lesson.scenarios}
                labels={labels.scenarios}
                connectHref={APP_ROUTES.connect}
                isLoading={isLoading}
                onSelect={screen.on.selectScenario}
                onGuard={screen.on.toggleGuard}
                onReveal={screen.on.revealHint}
                onCopy={copy}
            />
        ),
        action: <PrimaryAction primary={primary} />,
    }
}

/** Challenges: the ladder of four rungs, the rung on screen with its rubric and the interviewer's push-back questions; the primary runs the rung again. */
export const applyLayout: PartLayoutOf = (context) => {
    const { lesson, screen, isLoading } = context
    const { labels, primary } = screen.props.runs
    const questions = lesson.apply.challenge?.questions ?? []
    return {
        main: (
            <EssentialApply
                part={lesson.apply}
                labels={labels.apply}
                essence={
                    questions.length === 0 ? null : (
                        <Stack gap="section">
                            {questions.map((question) => (
                                <Stack key={question.id} gap="row">
                                    <LessonQuestion
                                        question={question}
                                        labels={screen.props.essence}
                                        isLoading={isLoading}
                                        onAnswer={screen.on.answer}
                                    />
                                    <WrittenOf {...context} questionId={question.id} />
                                </Stack>
                            ))}
                        </Stack>
                    )
                }
                isLoading={isLoading}
                onSelect={screen.on.selectChallenge}
            />
        ),
        action: <PrimaryAction primary={primary} />,
    }
}

/** The end of the lesson, "trước và sau": the three figures and each essence before and after; the header goes on to the next lesson. */
const endLayout: PartLayoutOf = ({ lesson, screen, isLoading }) => {
    const { shell } = screen.props
    if (lesson.end === undefined) return { main: <EmptyNotice message={screen.props.page.soon} />, action: undefined }
    return {
        main: (
            <LessonEnd
                view={lesson.end}
                labels={{
                    before: shell.end.before,
                    after: shell.end.after,
                    essence: shell.end.essence,
                    review: shell.end.review,
                }}
                isLoading={isLoading}
                reviewHref={APP_ROUTES.review}
            />
        ),
        action:
            lesson.nextLesson === undefined ? undefined : (
                <Button variant="primary" href={lesson.nextLesson.href}>
                    {shell.nextLesson(lesson.nextLesson.title)}
                </Button>
            ),
    }
}

/**
 * A part the plan lacks, shown to a reader without it: one notice for the four parts, what stays and the way to compare plans. A guest
 * is asked to sign in first (the score and progress are then saved); a signed-in reader is asked to upgrade.
 */
export const lockedLayout: PartLayoutOf = (context) => {
    const { lesson, screen } = context
    const { shell, lock, isGuest, page } = screen.props
    const action = {
        label: isGuest ? lock.signIn : shell.upgrade,
        href: isGuest ? screen.props.signInHref : screen.props.plansHref,
    }
    return {
        main: (
            <LessonLockedPart
                eyebrow={shell.lockedEyebrow}
                title={isGuest ? lock.guestTitle : shell.lockedTitle(page.parts[lesson.part])}
                description={isGuest ? lock.guestNote : shell.lockedDescription}
                tiles={LOCKABLE_PARTS.map((id) => ({
                    id,
                    title: page.parts[id],
                    note: lock.notes[id],
                    isCurrent: id === lesson.part,
                }))}
                compare={isGuest ? undefined : { label: shell.lockedCompare, href: screen.props.plansHref }}
                price=""
                action={undefined}
            />
        ),
        action: (
            <Button variant="primary" href={action.href}>
                {action.label}
            </Button>
        ),
    }
}

/** Props for {@link EssentialLessonBase}: the resolved props and the actions of the screen. */
export type EssentialLessonBaseProps = {
    /** The public base of the statics: the opener's pictures and the logos of its system figure. */
    readonly staticsBaseUrl: string
    readonly props: EssentialLessonScreen["props"]
    readonly on: EssentialLessonScreen["on"]
}

/** The layout of each part; a part the reader's plan lacks is drawn by the locked layout instead. */
const LAYOUTS: Readonly<Record<EssentialLessonView["part"], PartLayoutOf>> = {
    essence: essenceLayout,
    source: readingLayout,
    scenarios: bugsLayout,
    apply: applyLayout,
    pattern: patternLayout,
}

/** What the layout of the part on screen is built from. */
const layoutOf = (context: PartContext): PartLayout => {
    const { lesson, screen, isLoading } = context
    // While the first read runs every part draws as the opener's skeleton: the same bones whatever the address names.
    if (isLoading) return essenceLayout(context)
    if (lesson.isLocked) return lockedLayout(context)
    if (lesson.hasNoPart && lesson.part !== "essence") {
        return { main: <EmptyNotice message={screen.props.page.soon} />, action: undefined }
    }
    return lesson.isEnd ? endLayout(context) : LAYOUTS[lesson.part](context)
}

/** The header: the trail through the topic, the English keyword title, one Vietnamese line, one meta line and the command of the part. */
const bandOf = (
    lesson: EssentialLessonView,
    layout: PartLayout,
    props: EssentialLessonBaseProps,
): PageHeaderContent => ({
    breadcrumbs: {
        label: props.props.page.breadcrumbs,
        items: [
            { id: "essentials", label: props.props.page.pageTitle, href: props.props.catalogHref },
            ...lesson.trail,
        ],
    },
    title: lesson.title,
    titleScale: "standard",
    ...(lesson.subtitle === ""
        ? {}
        : {
              description: (
                  <ExpandableText
                      text={lesson.subtitle}
                      moreLabel={props.props.page.more}
                      lessLabel={props.props.page.less}
                  />
              ),
          }),
    meta: lesson.facts,
    tabs: partTabsOf(lesson, props),
    ...(layout.action === undefined ? {} : { actions: layout.action }),
})

/**
 * The five parts as the page's underline tabs, the same on every part (owner 2026-11-23: navigation is the secondary underline tabs): a
 * part the reader's plan lacks carries the lock and still opens (its notice says what Premium adds); none is selected at the end.
 */
const partTabsOf = (
    lesson: EssentialLessonView,
    props: EssentialLessonBaseProps,
): NonNullable<PageHeaderContent["tabs"]> => ({
    label: props.props.shell.rail.label,
    kind: "views",
    // A locked part carries a leading lock: the label stays at every width, or a phone would show four bare locks.
    labelVisibility: "always",
    selectedKey: lesson.isEnd ? "" : lesson.part,
    items: PART_ORDER.map((id) => ({
        id,
        label: props.props.page.parts[id],
        ...(lesson.rail.find((step) => step.id === id)?.isLocked === true
            ? { leading: <LockIcon label={props.props.shell.lockedEyebrow} /> }
            : {}),
    })),
    onSelect: (key) => {
        const part = PART_ORDER.find((id) => id === key)
        if (part !== undefined) props.on.openPart(part)
    },
})

/**
 * One lesson in five parts (`?part=`), the parts the header's underline tabs on every part and at every width: Mở đầu (the five-question opener), Bản chất (the
 * practice-led reading), Tìm sạn (the bug pack), Challenges and Pattern, then the end of the lesson ("trước và sau", `?part=end`). Each
 * part hands the shell a body and the one command the header carries; a part the reader's plan lacks is the locked notice (the back end
 * names the locked parts and never sends their payload).
 */
export const EssentialLessonBase = (props: EssentialLessonBaseProps) => {
    const { slot, placeholder, slotLabels } = props.props
    const isPhone = useIsPhone()
    const layoutFor = (lesson: EssentialLessonView, isLoading: boolean): PartLayout =>
        layoutOf({ lesson, screen: props, isLoading, isPhone, staticsBaseUrl: props.staticsBaseUrl })
    return (
        <SlotView<EssentialLessonView, PageHeaderContent, ReactNode>
            slot={slot}
            placeholder={placeholder}
            labels={slotLabels}
            errorDescription={props.props.errorText}
            forbiddenAction={
                <Button variant="primary" href={props.props.plansHref}>
                    {props.props.shell.upgrade}
                </Button>
            }
            onRetry={props.on.retry}
            header={(lesson, isLoading) => bandOf(lesson, layoutFor(lesson, isLoading), props)}
            headerFallback={{
                title: props.props.page.pageTitle,
                breadcrumbs: {
                    label: props.props.page.breadcrumbs,
                    items: [{ id: "essentials", label: props.props.page.pageTitle }],
                },
            }}
            frame={({ header, body, isLoading }) => (
                <Page chrome="panes" layout="workspace" isLoading={isLoading} header={header}>
                    <PaneGrid
                        label={props.props.page.pageTitle}
                        areas={{ base: ["main"] }}
                        columns={{ base: ["fill"] }}
                        rows={{ base: ["fill"] }}
                    >
                        <Pane area="main">
                            <PaneSection gap="section">{body}</PaneSection>
                        </Pane>
                    </PaneGrid>
                </Page>
            )}
            render={(each, isLoading) => layoutFor(each, isLoading).main}
        />
    )
}
