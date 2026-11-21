import { Skeleton as HeroSkeleton } from "@heroui/react"
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
    ArtImage,
    DoneIcon,
    EssentialApply,
    EssentialApplyAside,
    EssentialBugHunt,
    EssentialBugHuntAside,
    EssentialPattern,
    EssentialPatternAside,
    EssentialPatternLink,
    EssentialReading,
    EssentialReadingAside,
    LessonJourneyBlock,
    WrittenCard,
    EssentialPartIntro,
    EssentialScenarios,
    EssentialSource,
    EssentialSourceAside,
    EssentialSourceDownload,
    LessonArticleBody,
    LessonEssenceAside,
    LessonLockedPart,
    LessonOpenerHead,
    LessonQuestion,
    LessonResult,
    LessonStoryCard,
    LessonStoryQuestion,
    LockIcon,
    SlotView,
    areaArt,
} from "@starci-next/ui"
import { LOCKABLE_PARTS } from "@/hooks/essentialLesson"
import type { EssentialLessonScreen, EssentialLessonView, EssentialPrimary } from "@/hooks/essentialLesson"
import { staticsBase } from "@/modules/config"
import { APP_ROUTES } from "@/modules/routes"

/** What a part is drawn from: the lesson as the screen resolved it, the screen's props and actions, and whether the first read still runs. */
export type PartContext = {
    readonly lesson: EssentialLessonView
    readonly screen: EssentialLessonScreen
    readonly isLoading: boolean
}

/**
 * What one part of the lesson page hands the shell: its body, the right column it keeps beside the body on wide screens (undefined
 * leaves the body the whole width) and the one primary command the page header carries for it (undefined draws none).
 */
export type PartLayout = {
    readonly main: ReactNode
    readonly aside: ReactNode | undefined
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
                intent="commit"
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

/** The one primary the header carries for the stage on screen of essence. */
const actionOf = ({ lesson, screen }: PartContext) => {
    const { essence } = lesson
    const { shell } = screen.props
    const on = screen.on
    // While the questions are on screen the panel of a right pick carries the one command on (the next development of the story).
    if (essence.stage === "questions") return undefined
    if (essence.stage === "result") {
        if (lesson.isFree && essence.retakeLine !== "") {
            return (
                <Button intent="commit" width="wrap" href={screen.props.plansHref}>
                    {shell.upgrade}
                </Button>
            )
        }
        return (
            <Button intent="commit" width="wrap" onPress={() => on.showStage("article")}>
                {shell.readArticle}
            </Button>
        )
    }
    return (
        <Button intent="commit" width="wrap" onPress={on.retake}>
            {shell.retake}
        </Button>
    )
}

/** The article under the questions: its eyebrow, the contents and every section. */
const ArticleBlock = ({ lesson, screen }: PartContext) => (
    <LessonArticleBody view={lesson.essence} labels={screen.props.essence} />
)

/** The body of the stage on screen: the question and the article below it, the result, or the article alone. */
const mainOf = (context: PartContext) => {
    const { lesson, screen, isLoading } = context
    const { essence } = lesson
    const labels = screen.props.essence
    if (essence.stage === "result") {
        return (
            <LessonResult
                view={essence}
                labels={labels}
                onRead={() => screen.on.showStage("article")}
                onReview={() => screen.on.moveOpener(0)}
                // The header carries "Đọc bài viết" unless it asks a free reader who retook the five to upgrade.
                showRead={lesson.isFree && essence.retakeLine !== ""}
                onUpgrade={screen.on.openPlans}
            />
        )
    }
    const question = essence.questions[essence.index]
    if (essence.stage === "article" || question === undefined) return <ArticleBlock {...context} />
    const isLast = essence.index >= essence.questions.length - 1
    return (
        <Stack gap="region">
            <Stack gap="section">
                <LessonStoryCard view={essence} labels={labels} />
                <LessonOpenerHead view={essence} labels={labels} isLoading={isLoading} />
                <LessonStoryQuestion
                    question={question}
                    labels={labels}
                    isLast={isLast}
                    onAnswer={screen.on.answer}
                    onNext={() => (isLast ? screen.on.showStage("result") : screen.on.moveOpener(essence.index + 1))}
                />
            </Stack>
            <ArticleBlock {...context} />
        </Stack>
    )
}

/** essence: the five opener questions, then the article with its contents; the right column keeps the four parts and the retake reminder. */
export const essenceLayout: PartLayoutOf = (context): PartLayout => ({
    main: mainOf(context),
    aside: <LessonEssenceAside view={context.lesson.essence} labels={context.screen.props.essence} />,
    action: actionOf(context),
})

/** The five parts with where the learner stands in each: the block every right column of the new parts ends with. */
const JourneyOf = ({ lesson, screen }: PartContext) => (
    <LessonJourneyBlock title={screen.props.five.journeyTitle} rows={lesson.journey} />
)

/** Copies a text to the clipboard of the learner. */
const copy = (text: string): void => void navigator.clipboard.writeText(text)

/**
 * Bản chất: the practice-led reading (sections/2-essence), its contents with "Nên đọc kỹ" where the opener was missed, and the MCP of
 * the lesson; the primary goes on to Tìm sạn. A lesson written before the reading keeps the source part.
 */
export const readingLayout: PartLayoutOf = (context) => {
    const { lesson, screen, isLoading } = context
    const reading = lesson.reading
    if (reading === undefined) return sourceLayout(context)
    const labels = screen.props.five.reading
    return {
        main: <EssentialReading view={reading} labels={labels} isLoading={isLoading} onCopy={copy} />,
        aside: <EssentialReadingAside view={reading} labels={labels} journey={<JourneyOf {...context} />} />,
        action: (
            <Button intent="commit" width="wrap" onPress={() => screen.on.openPart("scenarios")}>
                {screen.props.page.parts.scenarios}
            </Button>
        ),
    }
}

/**
 * Tìm sạn: the bug pack pulled and run on the learner's machine, every test with its newest result, why it passes or not yet, and its
 * hints one at a time. A lesson without a bug pack keeps its scenarios.
 */
export const bugsLayout: PartLayoutOf = (context) => {
    const { lesson, screen, isLoading } = context
    const hunt = lesson.bugHunt
    if (hunt === undefined) return scenariosLayout(context)
    const labels = screen.props.five.bugs
    return {
        main: (
            <EssentialBugHunt
                view={hunt}
                labels={labels}
                isLoading={isLoading}
                onCopy={copy}
                onHint={screen.on.openBugHint}
            />
        ),
        aside: <EssentialBugHuntAside view={hunt} labels={labels} journey={<JourneyOf {...context} />} />,
        action: undefined,
    }
}

/** Pattern: the stack tabs, the three questions, the snippet and the main files; the primary opens the folder on GitHub. Not graded. */
export const patternLayout: PartLayoutOf = (context) => {
    const { lesson, screen, isLoading } = context
    const pattern = lesson.pattern
    if (pattern === undefined)
        return { main: <EmptyNotice message={screen.props.page.soon} />, aside: undefined, action: undefined }
    const labels = screen.props.five.pattern
    return {
        main: (
            <EssentialPattern part={pattern} labels={labels} isLoading={isLoading} onSelect={screen.on.selectStack} />
        ),
        aside: <EssentialPatternAside part={pattern} labels={labels} journey={<JourneyOf {...context} />} />,
        action: <EssentialPatternLink href={pattern.url} label={labels.github} />,
    }
}

/** The written explanation an essence question asks: the box once the question was answered, a line before. */
const WrittenOf = ({ lesson, screen, questionId }: PartContext & { readonly questionId: string }) => {
    const written = lesson.written[questionId]
    if (written === undefined) return null
    if (!written.isOpen) return <Text tone="muted">{screen.props.five.writtenWait}</Text>
    return (
        <WrittenCard
            prompt={written.prompt}
            criteria={[]}
            instructions=""
            draft={written.draft}
            labels={screen.props.written}
            plansHref={screen.props.plansHref}
            onChange={(text) => screen.on.write(written.activityId, text)}
            onSubmit={() => screen.on.submitWritten(written.activityId)}
        />
    )
}

/** Source: the machine and the pull commands, the architecture, the rule each component keeps and the code walk; the archive is the primary. */
export const sourceLayout: PartLayoutOf = ({ lesson, screen, isLoading }) => {
    const { labels } = screen.props.runs
    return {
        main: (
            <Stack gap="region">
                <EssentialSource
                    source={lesson.source}
                    labels={labels.source}
                    isLoading={isLoading}
                    onCopy={(text) => void navigator.clipboard.writeText(text)}
                />
                {lesson.intro === undefined ? null : (
                    <EssentialPartIntro section={lesson.intro} labels={screen.props.labels} />
                )}
            </Stack>
        ),
        aside: <EssentialSourceAside source={lesson.source} labels={labels.source} />,
        action: <EssentialSourceDownload href={lesson.source.downloadHref} label={labels.primary.download} />,
    }
}

/** Kịch bản: the scenarios run on the learner's machine; the primary is run, check again or the next scenario. */
export const scenariosLayout: PartLayoutOf = ({ lesson, screen, isLoading }) => {
    const { labels, primary } = screen.props.runs
    return {
        main: (
            <Stack gap="region">
                <EssentialScenarios
                    part={lesson.scenarios}
                    labels={labels.scenarios}
                    connectHref={APP_ROUTES.connect}
                    isLoading={isLoading}
                    onSelect={screen.on.selectScenario}
                    onGuard={screen.on.toggleGuard}
                    onReveal={screen.on.revealHint}
                    onCopy={(text) => void navigator.clipboard.writeText(text)}
                />
                {lesson.intro === undefined ? null : (
                    <EssentialPartIntro section={lesson.intro} labels={screen.props.labels} />
                )}
            </Stack>
        ),
        aside: undefined,
        action: <PrimaryAction primary={primary} />,
    }
}

/** Challenges: the ladder of four rungs, the rung on screen with its rubric and its written explanation, and the score beside it; the primary runs the rung again. */
export const applyLayout: PartLayoutOf = (context) => {
    const { lesson, screen, isLoading } = context
    const { labels, primary } = screen.props.runs
    const questions = lesson.apply.challenge?.questions ?? []
    return {
        main: (
            <Stack gap="region">
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
                {lesson.intro === undefined ? null : (
                    <EssentialPartIntro section={lesson.intro} labels={screen.props.labels} />
                )}
            </Stack>
        ),
        aside: <EssentialApplyAside part={lesson.apply} labels={labels.apply} />,
        action: <PrimaryAction primary={primary} />,
    }
}

/** The parts the reader lacks, one card each; the part on screen is marked. */
const tilesOf = ({ lesson, screen }: PartContext) =>
    LOCKABLE_PARTS.map((id) => ({
        id,
        title: screen.props.page.parts[id],
        note: screen.props.lock.notes[id],
        isCurrent: id === lesson.part,
    }))

/**
 * A part the plan lacks, shown to a reader without it: the 3D lock, what stays, the way to compare plans and a card per locked part.
 * A guest is asked to sign in first (the score and progress are then saved); a signed-in reader is asked to upgrade.
 */
export const lockedLayout: PartLayoutOf = (context) => {
    const { screen } = context
    const { shell, lock, isGuest } = screen.props
    return {
        main: (
            <LessonLockedPart
                art={<ArtImage asset={areaArt("locked")} base={staticsBase()} />}
                title={isGuest ? lock.guestTitle : lock.premiumTitle}
                description={isGuest ? lock.guestNote : shell.lockedDescription}
                tiles={tilesOf(context)}
                compare={isGuest ? undefined : { label: shell.lockedCompare, href: screen.props.plansHref }}
            />
        ),
        aside: undefined,
        action: (
            <Button intent="commit" width="wrap" href={isGuest ? screen.props.signInHref : screen.props.plansHref}>
                {isGuest ? lock.signIn : shell.upgrade}
            </Button>
        ),
    }
}

/** Props for {@link EssentialLessonBase}: the resolved props and the actions of the screen. */
export type EssentialLessonBaseProps = {
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

/** What a tab wears at its start: the lock of a part Premium unlocks, the check of a finished one. */
const markOf = (tab: EssentialLessonView["tabs"][number], props: EssentialLessonBaseProps): ReactNode => {
    if (tab.state === "locked") return <LockIcon label={props.props.shell.tabLocked} />
    return tab.state === "done" ? <DoneIcon label={props.props.shell.tabDone} /> : undefined
}

/** What the layout of the part on screen is built from. */
const layoutOf = (context: PartContext): PartLayout => {
    const { lesson, screen } = context
    if (lesson.isLocked) return lockedLayout(context)
    if (lesson.hasNoPart && lesson.part !== "essence") {
        return { main: <EmptyNotice message={screen.props.page.soon} />, aside: undefined, action: undefined }
    }
    return LAYOUTS[lesson.part](context)
}

/** The band: the trail through the topic, the title, the problem the lesson solves, its facts, the primary of the part and the four parts as page tabs. */
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
    ...(layout.action === undefined ? {} : { actions: layout.action }),
    tabs: {
        label: props.props.page.tabs,
        kind: "views",
        labelVisibility: "always",
        items: lesson.tabs.map((tab) => {
            const mark = markOf(tab, props)
            return {
                id: tab.id,
                label: props.props.page.parts[tab.id],
                ...(tab.count === undefined ? {} : { count: tab.count }),
                ...(mark === undefined ? {} : { leading: mark }),
            }
        }),
        selectedKey: lesson.part,
        onSelect: (key) => {
            const tab = lesson.tabs.find((each) => each.id === key)
            if (tab !== undefined) props.on.openPart(tab.id)
        },
    },
})

/** n text bars, the last one shorter, like a paragraph. */
const Lines = (props: { readonly count: number }) => (
    <Stack gap="row">
        {Array.from({ length: props.count }, (_, index) => (
            <HeroSkeleton
                key={index}
                className={
                    index === props.count - 1 && props.count > 1 ? "h-4 w-2/3 rounded-lg" : "h-4 w-full rounded-lg"
                }
            />
        ))}
    </Stack>
)

/** The body while the first read runs: the opener line, the question and its choices, then the article, all bars. */
const LessonSkeleton = () => (
    <Stack gap="region">
        <HeroSkeleton className="h-4 w-1/2 rounded-lg" />
        <Lines count={2} />
        {[1, 2, 3, 4].map((choice) => (
            <HeroSkeleton key={choice} className="h-10 w-full rounded-xl" />
        ))}
        <Lines count={6} />
    </Stack>
)

/** The right column while the first read runs: its blocks as bars. */
const LessonAsideSkeleton = () => (
    <Stack gap="region">
        <Lines count={3} />
        <Lines count={3} />
    </Stack>
)

/**
 * One lesson in five parts, the page tabs of its band (`?part=`): Mở đầu (the five-question opener, the article), Bản chất (the
 * practice-led reading), Tìm sạn (the bug pack), Challenges and Pattern. Each part hands the shell a body, an optional right column and the one primary the band carries; a part
 * the reader's plan lacks is the locked notice (the back end names the locked parts and never sends their payload).
 */
export const EssentialLessonBase = (props: EssentialLessonBaseProps) => {
    const { slot, placeholder, slotLabels } = props.props
    const layoutFor = (lesson: EssentialLessonView, isLoading: boolean): PartLayout =>
        layoutOf({ lesson, screen: props, isLoading })
    return (
        <SlotView<EssentialLessonView, PageHeaderContent, ReactNode>
            slot={slot}
            placeholder={placeholder}
            labels={slotLabels}
            errorDescription={props.props.errorText}
            forbiddenAction={
                <Button intent="commit" width="wrap" href={props.props.plansHref}>
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
            aside={(lesson, isLoading) => layoutFor(lesson, isLoading).aside}
            frame={({ header, aside, body, isLoading }) => (
                <Page chrome="panes" layout="workspace" isLoading={isLoading} header={header}>
                    <PaneGrid
                        label={props.props.page.pageTitle}
                        areas={aside === undefined ? { base: ["main"] } : { base: ["main"], wide: ["main aside"] }}
                        columns={
                            aside === undefined ? { base: ["fill"] } : { base: ["fill"], wide: ["fill", "standard"] }
                        }
                        rows={{ base: ["fill"] }}
                    >
                        <Pane area="main">
                            <PaneSection gap="section">{isLoading ? <LessonSkeleton /> : body}</PaneSection>
                        </Pane>
                        {aside === undefined ? null : (
                            <Pane area="aside" surface>
                                {isLoading ? <LessonAsideSkeleton /> : aside}
                            </Pane>
                        )}
                    </PaneGrid>
                </Page>
            )}
            render={(each, isLoading) => layoutFor(each, isLoading).main}
        />
    )
}
