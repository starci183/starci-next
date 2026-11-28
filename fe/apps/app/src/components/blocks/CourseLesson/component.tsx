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
    CourseArchitectureRail,
    CourseAudit,
    CourseAuditRail,
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
    /** All of the panel (default), only its notice (a loop's main column), or all but its notice (a loop's rail). */
    readonly part?: "all" | "notice" | "panel"
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
        part={props.part ?? "all"}
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
 * The main column of a split page with the page's notices on top (owner 2026-11-28: "alert phải nằm giữa chứ sao nằm trên"): the notices
 * stand at the reading measure in the main column, centred like the text under them, never across the main column and the rail.
 */
const withNotices = (props: CourseLessonBaseProps, view: CourseLessonView, primary: ReactNode): ReactNode =>
    view.missing === undefined && view.hintNotice === undefined ? (
        primary
    ) : (
        <Stack gap="section">
            <Stack gap="section" measure="reading">
                <Notices base={props} view={view} />
            </Stack>
            {primary}
        </Stack>
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
        primary={withNotices(props, view, <CourseIntro view={view.intro} labels={props.props.labels.intro} isLoading={isLoading} />)}
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
        primary={withNotices(
            props,
            view,
            <CoursePattern view={view.pattern} labels={props.props.labels.pattern} isLoading={isLoading} />,
        )}
        rail={<CourseIntroLab view={view.patternLab} isLoading={isLoading} onStart={() => props.on.openPage("submit")} />}
    />
)

/**
 * The Kiến trúc page split like the intro (owner 2026-11-28: "kiến trúc cũng chia 2"): how the system is built and the code that runs in the
 * main column; the system's card in the rail (its kind, services and infrastructure), its command the page after this one (the happy path).
 */
const architectureBodyOf = (props: CourseLessonBaseProps, view: CourseLessonView, isLoading: boolean): ReactNode => (
    <Grid
        kind="main-rail"
        railWidth="wide"
        align="start"
        primary={withNotices(
            props,
            view,
            <CourseArchitecture view={view.architecture} labels={props.props.labels.architecture} isLoading={isLoading} />,
        )}
        // The system's own card (owner 2026-11-28: "đừng ghi bài lab trên máy bạn, ghi rõ kiểu kiến trúc"): the intro already has the lab card.
        rail={
            <CourseArchitectureRail
                view={view.architectureRail}
                isLoading={isLoading}
                onNext={() => props.on.openPage(view.next?.page ?? "happy")}
            />
        }
    />
)

/**
 * The submit page split like the others (owner 2026-11-28): the grading (its conditions, the matrix, the command) and, once passed, the gift
 * repos (the StarCi standard with the command that fetches its source, then real repos) in the main column at the reading measure; the
 * progress card in the rail, its command back to the cases still open (none once every case passes).
 */
const submitBodyOf = (props: CourseLessonBaseProps, view: CourseLessonView, isLoading: boolean): ReactNode => (
    <Grid
        kind="main-rail"
        railWidth="wide"
        align="start"
        primary={withNotices(
            props,
            view,
            <Stack gap="region" measure="reading">
                <Lab view={view} stage="submit" />
                {view.production === undefined ? null : (
                    <CourseProduction view={view.production} labels={props.props.labels.production} />
                )}
            </Stack>,
        )}
        rail={
            <CourseIntroLab
                view={{ ...view.patternLab, start: view.missing?.action?.label ?? "", caption: view.missing?.text ?? view.patternLab.caption }}
                isLoading={isLoading}
                onStart={() => props.on.openPage(view.missing?.action?.page ?? "unhappy", view.missing?.action?.caseId)}
            />
        }
    />
)

/**
 * The dev-only Audit tab (owner 2026-11-28) split like the others: the verdict of every page, every case as it is now and the findings in the
 * main column at the reading measure; the audit's card in the rail (its counts, the day it ran, the reader it played, what that reader must
 * know first). A lesson with no audit says so in the main column and has no rail card.
 */
const auditBodyOf = (props: CourseLessonBaseProps, view: CourseLessonView, isLoading: boolean): ReactNode => (
    <Grid
        kind="main-rail"
        railWidth="wide"
        align="start"
        primary={withNotices(props, view, <CourseAudit view={view.audit} labels={props.props.labels.audit} isLoading={isLoading} />)}
        rail={view.auditRail === undefined ? null : <CourseAuditRail view={view.auditRail} isLoading={isLoading} />}
    />
)

/** The body of the pages not drawn by their own split above: the setup (the lab panel splits itself), else the page's own body. */
const columnOf = (props: CourseLessonBaseProps, view: CourseLessonView, isLoading: boolean): ReactNode => {
    if (view.page === "pattern") return patternBodyOf(props, view, isLoading)
    if (view.page === "architecture") return architectureBodyOf(props, view, isLoading)
    if (view.page === "submit") return submitBodyOf(props, view, isLoading)
    if (view.page === "audit") return auditBodyOf(props, view, isLoading)
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
        primary={withNotices(
            props,
            view,
            <Stack gap="section">
                {/* The lab's own notice (the machine lost) in the main column, at the reading measure (owner 2026-11-28). */}
                <Stack gap="section" measure="reading">
                    <Lab view={view} stage="work" part="notice" />
                </Stack>
                <CourseCaseLoop
                view={view.loop}
                labels={props.props.labels.loop}
                isLoading={isLoading}
                onSelect={props.on.selectCase}
                onHint={props.on.openHint}
                />
            </Stack>,
        )}
        rail={<Lab view={view} stage="work" part="panel" />}
    />
)

/** The pages split into a main column and a rail: their notices stand in the main column. */
const isSplit = (view: CourseLessonView): boolean =>
    view.page === "intro" ||
    view.page === "happy" ||
    view.page === "unhappy" ||
    view.page === "pattern" ||
    view.page === "architecture" ||
    view.page === "submit" ||
    view.page === "audit"

/** The body of the page on screen under its notices: a loop has the lab panel beside it, the intro its lab card, any other page is one column. */
const bodyOf = (props: CourseLessonBaseProps, view: CourseLessonView, isLoading: boolean): ReactNode => (
    <Stack gap="section">
        {/* A split page draws its notices in its main column (withNotices); a one-column page above its body. */}
        {isSplit(view) ? null : <Notices base={props} view={view} />}
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
            // A course named like its one lesson (the concept, "Saga") would read "Saga / Saga": the lesson's crumb says it once.
            ...(view.courseTitle === "" || view.courseTitle === view.title
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
 * from the record), the setup, the static Kiến trúc page (how the system is built and the code that runs), the normal order, the failures, the recap
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
