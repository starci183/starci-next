import { Button, Page, Pane, PaneGrid, PaneSection } from "@starci/grammar/common"
import { CourseCatalog, SlotView, type CourseCatalogCourseView } from "@starci-next/ui"
import type { CourseCatalogScreen } from "@/hooks/courseCatalog"

/** Props for {@link CourseCatalogBase}: the resolved props and the actions of the screen. */
export type CourseCatalogBaseProps = {
    readonly props: CourseCatalogScreen["props"]
    readonly on: CourseCatalogScreen["on"]
}

/** The placeholder of the first read: one course of three blank lessons. */
const PLACEHOLDER: ReadonlyArray<CourseCatalogCourseView> = [
    {
        id: "course",
        title: "",
        summary: "",
        lessons: [1, 2, 3].map((n) => ({ id: `lesson-${n}`, title: "", concept: "", href: undefined })),
    },
]

/**
 * The Essentials v2 page: the courses with their lessons as flat lists, each lesson linking to the six pages of its lab. A guest is asked
 * to sign in; the catalog itself is free for any signed-in learner.
 */
export const CourseCatalogBase = (props: CourseCatalogBaseProps) => {
    const view = props.props
    return (
        <SlotView<ReadonlyArray<CourseCatalogCourseView>>
            slot={view.slot}
            placeholder={PLACEHOLDER}
            labels={view.slotLabels}
            errorDescription={view.errorText}
            forbiddenDescription={view.forbidden}
            forbiddenAction={
                <Button variant="primary" href={view.isGuest ? view.signInHref : view.plansHref}>
                    {view.isGuest ? view.signIn : view.upgrade}
                </Button>
            }
            onRetry={props.on.retry}
            render={(courses, isLoading) => (
                <CourseCatalog courses={courses} labels={view.labels} isLoading={isLoading} />
            )}
            frame={({ body, isLoading }) => (
                <Page
                    chrome="panes"
                    layout="workspace"
                    isLoading={isLoading}
                    header={{ breadcrumbs: "root", title: view.pageHeading, meta: view.pageSub }}
                >
                    <PaneGrid
                        label={view.pageHeading}
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
        />
    )
}
