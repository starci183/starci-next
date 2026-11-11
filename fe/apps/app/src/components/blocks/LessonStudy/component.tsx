import { useState } from "react"
import { Button, Page, Pane, PaneGrid, PaneSection } from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { DataSlot, LessonStudyScreen, StudyView } from "@/modules/types"
import { LessonAside } from "./aside"
import { bandOf } from "./band"
import { StudyBody } from "./body"

/** Props for {@link LessonStudyBase}: the resolved props and the actions of the screen. */
export type LessonStudyBaseProps = { readonly props: LessonStudyScreen["props"]; readonly on: LessonStudyScreen["on"] }

/** The lesson the page draws: the settled one, the placeholder while the first read runs, none for any other status (the band then has nothing to say). */
const studyOfSlot = (slot: DataSlot<StudyView>, placeholder: StudyView): StudyView | undefined => {
    if ("items" in slot) return slot.items
    if ("isLoading" in slot) return placeholder
    return undefined
}

/**
 * Draws a lesson as a panes page: the band (trail from the catalog, title, level and facts, the way to begin or, on a phase page, the phases as page tabs),
 * the well of cards in the main pane and the aside pane on the surface. One screen draws every lesson; the phase is the address's `?phase=`.
 * A phase that needs Premium draws the locked notice with the link to the plans in place of its cards. Below the wide breakpoint the aside is a drawer.
 */
export const LessonStudyBase = (props: LessonStudyBaseProps) => {
    const { labels, plansHref, catalogHref, reviewHref, projectsHref, slot, placeholder } = props.props
    const [isAsideOpen, setIsAsideOpen] = useState(false)
    const isLoading = "isLoading" in slot
    const study = studyOfSlot(slot, placeholder)
    const env = { labels, plansHref, reviewHref, projectsHref, on: props.on, isLoading }
    const asideLabel = labels.progress.title
    return (
        <Page
            chrome="panes"
            isLoading={isLoading}
            {...(study === undefined ? {} : { header: bandOf({ study, env, catalogHref }) })}
        >
            <PaneGrid
                label={labels.pageTitle}
                areas={{ base: ["main"], wide: ["main aside"] }}
                columns={{ base: ["fill"], wide: ["fill", "standard"] }}
            >
                <Pane area="main" scroll label={labels.pageTitle}>
                    <PaneSection gap="section">
                        <SlotView
                            slot={slot}
                            placeholder={placeholder}
                            labels={props.props.slotLabels}
                            forbiddenAction={
                                <Button intent="commit" href={plansHref}>
                                    {labels.plans}
                                </Button>
                            }
                            onRetry={props.on.retry}
                            render={(each, loading) => <StudyBody study={each} env={{ ...env, isLoading: loading }} />}
                        />
                    </PaneSection>
                </Pane>
                {study === undefined ? null : (
                    <Pane
                        area="aside"
                        surface
                        scroll
                        label={asideLabel}
                        collapse="drawer"
                        collapseLabel={asideLabel}
                        openLabel={asideLabel}
                        closeLabel={labels.rail.close}
                        isOpen={isAsideOpen}
                        onOpenChange={setIsAsideOpen}
                    >
                        <LessonAside study={study} labels={labels} plansHref={plansHref} />
                    </Pane>
                )}
            </PaneGrid>
        </Page>
    )
}
