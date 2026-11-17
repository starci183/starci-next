import { SurfaceCard } from "@starci/grammar/common"
import type { LessonCompletionLabels } from "../StudyBody/types"

/** What the completion card needs: the lesson, when it was completed, the words and where the review and the project lead. */
type CompletionCardProps = {
    readonly lessonTitle: string
    readonly completedAt: string
    readonly time: string
    readonly labels: LessonCompletionLabels
    readonly reviewHref: string
    readonly projectsHref: string
}

/** The completion of the lesson: that it is done and when, the reviews it opened and the way to take it to a project. Nothing before the completion. */
export const CompletionCard = (props: CompletionCardProps) =>
    props.completedAt === "" ? null : (
        <SurfaceCard
            kind="list"
            label={props.labels.title}
            empty={props.labels.title}
            items={[
                { id: "done", title: props.labels.done(props.lessonTitle), meta: { text: props.time } },
                {
                    id: "reviews",
                    title: props.labels.reviewsOpen,
                    action: { label: props.labels.reviewsLink, href: props.reviewHref },
                    actionPlacement: "end",
                },
                {
                    id: "project",
                    title: props.labels.project,
                    action: { label: props.labels.projectLink, href: props.projectsHref },
                    actionPlacement: "end",
                },
            ]}
        />
    )
