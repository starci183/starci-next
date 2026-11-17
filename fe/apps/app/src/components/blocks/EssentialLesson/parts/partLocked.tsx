import { Button } from "@starci/grammar/common"
import { LessonLockedPart } from "@starci-next/ui"
import type { PartLayoutOf } from "../layout"

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
