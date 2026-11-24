import { Button } from "@starci/grammar/common"
import { LessonLabPanel, SlotView } from "@starci-next/ui"
import type { CourseLabPanelView, CourseLabScreen } from "@/hooks/courseLab"
import { useIsPhone } from "@/hooks/publicCv/useViewport"

/** What the lab block draws and what the learner does in it. */
type CourseLabBaseProps = {
    readonly props: CourseLabScreen["props"]
    readonly on: CourseLabScreen["on"]
}

/**
 * The lab panel of the "Sửa" step: the read of the lab through the one status view (a lab the plan lacks says so with the way to the
 * plans, a failed read offers its retry), drawn by the lab panel once read.
 */
export const CourseLabBase = (props: CourseLabBaseProps) => {
    const { lab, placeholder, labels } = props.props
    const isPhone = useIsPhone()
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
                    isPhone={isPhone}
                    isLoading={isLoading}
                    on={props.on}
                />
            )}
        />
    )
}
