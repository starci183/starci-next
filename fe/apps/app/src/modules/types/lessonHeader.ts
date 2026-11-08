import type { DataSlot } from "@starci-next/ui"
import type { LessonStudyLabels, StudyView } from "./study"
import { trailHeaderOf, type TrailHeaderPart } from "./trailHeader"

/** The page header of a lesson: its title and the trail from the catalog through its topic; the placeholder's while the first read runs, none for any other status. */
export const pageHeaderOf = (
    slot: DataSlot<StudyView>,
    placeholder: StudyView,
    labels: Pick<LessonStudyLabels, "breadcrumbs" | "pageTitle">,
    catalogHref: string,
): TrailHeaderPart =>
    trailHeaderOf(slot, placeholder, labels.breadcrumbs, (study) => ({
        title: study.title,
        items: [
            { id: "essentials", label: labels.pageTitle, href: catalogHref },
            { id: "topic", label: study.topic.title, href: study.topic.href },
            { id: "lesson", label: study.title },
        ],
    }))
