import { Markdown, SurfaceCard } from "@starci/grammar/common"
import { LessonCode } from "../LessonCode"
import type { MarkdownLabels } from "../StudyBody/types"

/** What the explanation of a graded choice needs. */
type ChoiceWhyProps = {
    readonly title: string
    readonly options: ReadonlyArray<{ readonly id: string; readonly label: string }>
    readonly explanations: Readonly<Record<string, string>>
    readonly correctId: string
    readonly correctWords: string
    readonly markdownLabels: MarkdownLabels
}

/** The reason behind each option of a graded choice, in normal text under the option it explains: the right one first, marked. */
export const ChoiceWhy = (props: ChoiceWhyProps) => {
    const ordered = [...props.options].toSorted(
        (a, b) => Number(b.id === props.correctId) - Number(a.id === props.correctId),
    )
    return (
        <SurfaceCard
            kind="list"
            label={props.title}
            empty={props.title}
            items={ordered.flatMap((option) => {
                const explanation = props.explanations[option.id]
                if (explanation === undefined || explanation === "") return []
                return [
                    {
                        id: option.id,
                        title: option.label,
                        ...(option.id === props.correctId
                            ? { badges: [{ label: props.correctWords, tone: "success" as const }] as const }
                            : {}),
                        detail: (
                            <Markdown
                                source={explanation}
                                measure="compact"
                                labels={props.markdownLabels}
                                renderCode={(code) => <LessonCode code={code} />}
                            />
                        ),
                    },
                ]
            })}
        />
    )
}
