import {
    Button,
    EmptyNotice,
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
    DoneIcon,
    EssentialApply,
    EssentialApplyAside,
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
    LockIcon,
    SlotView,
} from "@starci-next/ui"
import type { EssentialLessonScreen, EssentialLessonView, EssentialPrimary } from "@/hooks/essentialLesson"
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
    const last = essence.questions.length - 1
    if (essence.stage === "questions") {
        const current = essence.questions[essence.index]
        const isGraded = current?.status === "graded"
        if (!isGraded)
            return (
                <Button intent="commit" isDisabled>
                    {shell.nextQuestion}
                </Button>
            )
        if (essence.index < last) {
            return (
                <Button intent="commit" onPress={() => on.moveOpener(essence.index + 1)}>
                    {shell.questionNumber(essence.index + 2)}
                </Button>
            )
        }
        return (
            <Button intent="commit" onPress={() => on.showStage("result")}>
                {shell.seeResult}
            </Button>
        )
    }
    if (essence.stage === "result") {
        if (lesson.isFree && essence.retakeLine !== "") {
            return (
                <Button intent="commit" href={screen.props.plansHref}>
                    {shell.upgrade}
                </Button>
            )
        }
        return (
            <Button intent="commit" onPress={() => on.showStage("article")}>
                {shell.readArticle}
            </Button>
        )
    }
    return (
        <Button intent="commit" onPress={on.retake}>
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
            />
        )
    }
    const question = essence.questions[essence.index]
    if (essence.stage === "article" || question === undefined) return <ArticleBlock {...context} />
    return (
        <Stack gap="region">
            <Stack gap="section">
                <LessonOpenerHead view={essence} labels={labels} isLoading={isLoading} />
                <LessonQuestion question={question} labels={labels} isLoading={isLoading} onAnswer={screen.on.answer} />
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

/** Tự áp dụng: the ladder of four rungs, the rung on screen with its rubric, and the score beside it; the primary runs the rung again. */
export const applyLayout: PartLayoutOf = ({ lesson, screen, isLoading }) => {
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
                                    <LessonQuestion
                                        key={question.id}
                                        question={question}
                                        labels={screen.props.essence}
                                        isLoading={isLoading}
                                        onAnswer={screen.on.answer}
                                    />
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

/** A part Premium unlocks, shown to a reader without it: what it holds and the way to Premium; the primary is the upgrade. */
export const lockedLayout: PartLayoutOf = ({ lesson, screen }) => {
    const { shell } = screen.props
    const words = lesson.part === "essence" ? undefined : shell.locked[lesson.part]
    const back = lesson.tabs.find((tab) => tab.id === "essence")
    return {
        main:
            words === undefined ? null : (
                <LessonLockedPart
                    title={words.title}
                    description={shell.lockedDescription}
                    listTitle={shell.lockedList}
                    contents={words.contents}
                    backLabel={shell.lockedBack}
                    backHref={back?.href ?? screen.props.catalogHref}
                    compareLabel={shell.lockedCompare}
                    compareHref={screen.props.plansHref}
                />
            ),
        aside: undefined,
        action: (
            <Button intent="commit" href={screen.props.plansHref}>
                {shell.upgrade}
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
    source: sourceLayout,
    scenarios: scenariosLayout,
    apply: applyLayout,
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
            { id: "topic", label: lesson.topic.title, href: lesson.topic.href },
            { id: "lesson", label: lesson.title },
        ],
    },
    title: lesson.title,
    titleScale: "standard",
    ...(lesson.subtitle === "" ? {} : { description: lesson.subtitle }),
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
                label: tab.label,
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

/**
 * One lesson in four parts, the page tabs of its band (`?part=`): essence (the five-question opener, the article), Source,
 * Kịch bản and Tự áp dụng. Each part hands the shell a body, an optional right column and the one primary the band carries; a part
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
            forbiddenAction={
                <Button intent="commit" href={props.props.plansHref}>
                    {props.props.shell.upgrade}
                </Button>
            }
            onRetry={props.on.retry}
            header={(lesson, isLoading) => bandOf(lesson, layoutFor(lesson, isLoading), props)}
            headerFallback={{ title: props.props.page.pageTitle, breadcrumbs: "root" }}
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
                            <PaneSection gap="section">{body}</PaneSection>
                        </Pane>
                        {aside === undefined ? null : (
                            <Pane area="aside" surface>
                                {aside}
                            </Pane>
                        )}
                    </PaneGrid>
                </Page>
            )}
            render={(each, isLoading) => layoutFor(each, isLoading).main}
        />
    )
}
