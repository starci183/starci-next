import {
    Alert,
    Button,
    Grid,
    Page,
    Pane,
    PaneGrid,
    PaneSection,
    Stack,
    type PageHeaderContent,
} from "@starci/grammar/common"
import {
    CourseArchitecture,
    CourseCaseLoop,
    CourseIntro,
    CourseIntroLab,
    CoursePattern,
    CourseProduction,
    SlotView,
} from "@starci-next/ui"
import type { ReactNode } from "react"
import { CourseLab } from "@/components/blocks/CourseLab"
import type { CourseLessonScreen, CourseLessonView, CourseNoticeView } from "@/hooks/courseLesson"

/** Props for {@link CourseLessonBase}: the resolved props and the actions of the screen. */
export type CourseLessonBaseProps = {
    readonly props: CourseLessonScreen["props"]
    readonly on: CourseLessonScreen["on"]
}

/** What one notice above a page needs. */
type NoticeProps = {
    readonly notice: CourseNoticeView
    readonly base: CourseLessonBaseProps
}

/** The one button of a notice: to the plans, to the page that is missing, or a plain dismissal. */
const noticeActionOf = (props: NoticeProps) => {
    const { notice, base } = props
    const { action } = notice
    if (action !== undefined && notice.isPlans) return { label: action.label, href: base.props.plansHref }
    const { page } = action ?? { page: undefined }
    if (action !== undefined && page !== undefined) {
        return { label: action.label, onAction: () => base.on.openPage(page, action.caseId) }
    }
    return { label: base.props.labels.dismiss, onAction: base.on.dismissHint }
}

/** The notice above a page: what is missing or what failed, with its one way out. */
const Notice = (props: NoticeProps) => (
    <Alert
        tone="cautionary"
        title={props.notice.title}
        description={props.notice.text}
        action={noticeActionOf(props)}
    />
)

/** What the lab panel of a page needs. */
type LabProps = {
    readonly view: CourseLessonView
    readonly stage: "setup" | "work" | "submit"
}

/** The lab panel of the lesson, handed what the record and the learner's progress say. */
const Lab = (props: LabProps) => (
    <CourseLab
        courseId={props.view.courseId}
        lessonId={props.view.lessonId}
        stage={props.stage}
        faulty={props.view.faulty}
        caseResult={props.stage === "work" ? props.view.caseResult : undefined}
        hintsOpened={props.view.hintsOpened}
        timeSpentMs={props.view.timeSpentMs}
    />
)

/** What the notices of a page need. */
type NoticesProps = {
    readonly base: CourseLessonBaseProps
    readonly view: CourseLessonView
}

/** The notices a page may carry: the one that names what the page needs and the one of a hint that failed. */
const Notices = (props: NoticesProps) => (
    <>
        {props.view.missing === undefined ? null : <Notice notice={props.view.missing} base={props.base} />}
        {props.view.hintNotice === undefined ? null : <Notice notice={props.view.hintNotice} base={props.base} />}
    </>
)

/**
 * The intro split in two (owner 2026-11-27): the explainer, the interview question and what the learner will do in the main column; the
 * lab card in the rail, with the one command that opens the setup. The system itself is the architecture page's (lessons.md §7).
 */
const introBodyOf = (props: CourseLessonBaseProps, view: CourseLessonView, isLoading: boolean): ReactNode => (
    <Grid
        kind="main-rail"
        railWidth="wide"
        align="start"
        primary={<CourseIntro view={view.intro} labels={props.props.labels.intro} isLoading={isLoading} />}
        rail={<CourseIntroLab view={view.introLab} isLoading={isLoading} onStart={() => props.on.openPage("setup")} />}
    />
)

/**
 * The recap page (page 6) split like the intro: the recall, the concept, the questions with what the learner did and the full answer in
 * the main column; the progress card in the rail, with the one command that leads to the submission.
 */
const patternBodyOf = (props: CourseLessonBaseProps, view: CourseLessonView, isLoading: boolean): ReactNode => (
    <Grid
        kind="main-rail"
        railWidth="wide"
        align="start"
        primary={<CoursePattern view={view.pattern} labels={props.props.labels.pattern} isLoading={isLoading} />}
        rail={<CourseIntroLab view={view.patternLab} isLoading={isLoading} onStart={() => props.on.openPage("submit")} />}
    />
)

/** The body of the pages that are one column: the setup, the static Kiến trúc page and the submission with its gift repos. */
const columnOf = (props: CourseLessonBaseProps, view: CourseLessonView, isLoading: boolean): ReactNode => {
    const { labels } = props.props
    if (view.page === "pattern") return patternBodyOf(props, view, isLoading)
    if (view.page === "architecture") {
        return <CourseArchitecture view={view.architecture} labels={labels.architecture} isLoading={isLoading} />
    }
    if (view.page === "submit") {
        return (
            <Stack gap="region">
                <Lab view={view} stage="submit" />
                {view.production === undefined ? null : (
                    <CourseProduction view={view.production} labels={labels.production} />
                )}
            </Stack>
        )
    }
    // The setup is split like the intro: the lab panel lays its title, what the relay does and the steps in the main column and the
    // machine card in the rail.
    return <Lab view={view} stage="setup" />
}

/** A loop: the cases with the selected one in detail, and the lab panel beside them as the support the learner reads while working. */
const loopBodyOf = (props: CourseLessonBaseProps, view: CourseLessonView, isLoading: boolean): ReactNode => (
    <Grid
        kind="main-rail"
        railWidth="wide"
        align="start"
        primary={
            <CourseCaseLoop
                view={view.loop}
                labels={props.props.labels.loop}
                isLoading={isLoading}
                onSelect={props.on.selectCase}
                onHint={props.on.openHint}
            />
        }
        rail={<Lab view={view} stage="work" />}
    />
)

/** The body of the page on screen under its notices: a loop has the lab panel beside it, the intro its lab card, any other page is one column. */
const bodyOf = (props: CourseLessonBaseProps, view: CourseLessonView, isLoading: boolean): ReactNode => (
    <Stack gap="section">
        <Notices base={props} view={view} />
        {view.page === "happy" || view.page === "unhappy"
            ? loopBodyOf(props, view, isLoading)
            : view.page === "intro"
              ? introBodyOf(props, view, isLoading)
              : columnOf(props, view, isLoading)}
    </Stack>
)

/** The header band: the trail, the title, the meta line, the six pages as underline tabs and the command that goes on. */
const headerOf = (view: CourseLessonView, props: CourseLessonBaseProps): PageHeaderContent => ({
    breadcrumbs: {
        label: props.props.labels.breadcrumbs,
        items: [
            { id: "essentials", label: props.props.labels.essentials, href: props.props.catalogHref },
            ...(view.courseTitle === ""
                ? []
                : [{ id: "course", label: view.courseTitle, href: props.props.catalogHref }]),
            { id: "lesson", label: view.title },
        ],
    },
    title: view.title,
    titleScale: "standard",
    ...(view.description === "" ? {} : { description: view.description }),
    meta: view.meta,
    tabs: {
        label: props.props.labels.tabsLabel,
        kind: "views",
        selectedKey: view.page,
        items: props.props.labels.pageTabs,
        onSelect: (key) => {
            const tab = props.props.labels.pageTabs.find((each) => each.id === key)
            if (tab !== undefined) props.on.openPage(tab.id)
        },
    },
    ...(view.next === undefined
        ? {}
        : {
              actions: (
                  <Button variant="primary" onPress={() => props.on.openPage(view.next?.page ?? "intro")}>
                      {view.next.label}
                  </Button>
              ),
          }),
})

/**
 * One lab lesson in seven pages (`?page=`), the pages the header's underline tabs: the intro (the interview question, then the system drawn
 * from the record), the setup, the normal order, the static Kiến trúc page (how the system is built, no buttons), the failures, the recap
 * that names what the learner built and the submission, which after a pass hands over the gift repos (the StarCi standard and real
 * repositories, each its essence in words). A loop is the cases beside the lab
 * panel; a page reached before the one it needs says what is missing and still reads. A reader without the plan is told so in place, and
 * a guest is asked to sign in first.
 */
export const CourseLessonBase = (props: CourseLessonBaseProps) => {
    const { slot, placeholder, slotLabels, labels } = props.props
    return (
        <SlotView<CourseLessonView, PageHeaderContent, ReactNode>
            slot={slot}
            placeholder={placeholder}
            labels={slotLabels}
            errorDescription={props.props.errorText}
            forbiddenDescription={labels.forbidden}
            forbiddenAction={
                <Button variant="primary" href={props.props.isGuest ? props.props.signInHref : props.props.plansHref}>
                    {props.props.isGuest ? labels.signIn : labels.upgrade}
                </Button>
            }
            onRetry={props.on.retry}
            header={(view) => headerOf(view, props)}
            headerFallback={{
                title: labels.essentials,
                breadcrumbs: { label: labels.breadcrumbs, items: [{ id: "essentials", label: labels.essentials }] },
            }}
            frame={({ header, body, isLoading }) => (
                <Page chrome="panes" layout="workspace" isLoading={isLoading} header={header}>
                    <PaneGrid
                        label={labels.essentials}
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
            render={(view, isLoading) => bodyOf(props, view, isLoading)}
        />
    )
}
