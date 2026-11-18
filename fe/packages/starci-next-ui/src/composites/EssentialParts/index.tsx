import { Section, Text } from "@starci/grammar/common"
import { RichMarkdown } from "../RichMarkdown"
import { LessonCode } from "../LessonCode"
import type { ArticleSectionView, EssentialPartsLabels } from "./types"

export type { ArticleSectionView, EssentialPartsLabels, QuestionLink, QuestionStatus } from "./types"

/** The prose a part opens with: one section of the teacher's markdown. */
export const EssentialPartIntro = (props: {
    readonly section: ArticleSectionView
    readonly labels: EssentialPartsLabels
}) => (
    <Section title={props.section.title} headingLevel={2} id={`section-${props.section.id}`}>
        {props.section.isLocked ? (
            <Text tone="muted">{props.labels.article.locked}</Text>
        ) : (
            <RichMarkdown
                source={props.section.markdown}
                labels={props.labels.markdown}
                renderCode={(code) => <LessonCode code={code} />}
            />
        )}
    </Section>
)
