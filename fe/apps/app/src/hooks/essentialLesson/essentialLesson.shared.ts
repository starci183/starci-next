import type { ArticleSectionView } from "@starci-next/ui"
import { ESSENTIAL_PARTS, type EssentialPart, type LessonView } from "@/modules/types"

export { articleSectionsOf, partPath } from "@/hooks/lessonParts"
export type { EssentialDesk } from "@/hooks/lessonParts"

/** The part a `?part=` query names; anything else opens essence. */
export const partOf = (raw: string | undefined): EssentialPart =>
    ESSENTIAL_PARTS.find((each) => each === raw) ?? "essence"

/** The phase each part's own section is stored under (the topic-based format: sections/2-source, 3-scenarios, 4-apply). */
const PART_PHASES: Readonly<Record<Exclude<EssentialPart, "essence">, string>> = {
    source: "explore",
    scenarios: "apply",
    apply: "reflect",
}

/** The section a part opens with (its prose, owner style), for a lesson that carries the four parts; undefined otherwise. */
export const partSectionOf = (lesson: LessonView, part: EssentialPart): ArticleSectionView | undefined => {
    if (part === "essence" || lesson.essential === undefined) return undefined
    const section = lesson.sections.find((each) => each.phase === PART_PHASES[part])
    return section === undefined
        ? undefined
        : {
              id: section.id,
              title: section.title,
              markdown: section.markdown,
              isLocked: section.isLocked,
              isFlagged: false,
          }
}
