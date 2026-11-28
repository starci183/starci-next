import { Button } from "@starci/grammar/common"
import { LessonLabPanel, SlotView } from "@starci-next/ui"
import type { CourseLabPanelView, CourseLabScreen, LabPanelPart } from "@/hooks/courseLab"

/** What the lab block draws and what the learner does in it. */
type CourseLabBaseProps = {
    readonly props: CourseLabScreen["props"]
    readonly on: CourseLabScreen["on"]
    readonly part: LabPanelPart
}

/**
 * The lab panel of the part a lesson page shows (the setup page, the lab column of a loop, the submit page): the read of the lab through
 * the one status view (a lab the plan lacks says so with the way to the plans, a failed read offers its retry), drawn by the lab panel
 * once read.
 */
export const CourseLabBase = (props: CourseLabBaseProps) => {
    const { lab, placeholder, labels } = props.props
    // The notice alone: drawn once the read holds data (no skeleton, no status view: the panel's own mount shows those).
    if (props.part === "notice") {
        if (!("items" in lab)) return null
        return (
            <LessonLabPanel
                body={lab.items.body}
                notice={lab.items.notice}
                labels={labels.panel}
                part="notice"
                on={props.on}
            />
        )
    }
    return (
        <SlotView<CourseLabPanelView>
            slot={lab}
            placeholder={placeholder}
            labels={labels.slot}
            forbidden="notice"
            forbiddenAction={
                <Button variant="primary" href={labels.plansHref}>
                    {labels.upgrade}
                </Button>
            }
            onRetry={props.on.retry}
            render={(view, isLoading) => (
                <LessonLabPanel
                    body={view.body}
                    notice={view.notice}
                    labels={labels.panel}
                    part={props.part}
                    isLoading={isLoading}
                    on={props.on}
                />
            )}
        />
    )
}
