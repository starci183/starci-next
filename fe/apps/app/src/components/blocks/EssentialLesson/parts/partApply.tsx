import { Stack } from "@starci/grammar/common"
import { EssentialApply, EssentialApplyAside, EssentialPartIntro, LessonQuestion } from "@starci-next/ui"
import { PrimaryAction } from "./PrimaryAction"
import type { PartLayoutOf } from "../layout"

/** Tự áp dụng: the ladder of four rungs, the rung on screen with its rubric, and the score beside it; the primary runs the rung again. */
export const applyLayout: PartLayoutOf = ({ lesson, screen, isLoading }) => {
    const { labels, primary } = screen.props.runs
    const questions = lesson.apply.challenge?.questions ?? []
    return {
        main: (
            <Stack gap="region">
                <EssentialApply
                    part={lesson.apply}
                    labels={labels.apply}
                    essence={
                        questions.length === 0 ? null : (
                            <Stack gap="section">
                                {questions.map((question) => (
                                    <LessonQuestion
                                        key={question.id}
                                        question={question}
                                        labels={screen.props.essence}
                                        isLoading={isLoading}
                                        onAnswer={screen.on.answer}
                                    />
                                ))}
                            </Stack>
                        )
                    }
                    isLoading={isLoading}
                    onSelect={screen.on.selectChallenge}
                />
                {lesson.intro === undefined ? null : (
                    <EssentialPartIntro section={lesson.intro} labels={screen.props.labels} />
                )}
            </Stack>
        ),
        aside: <EssentialApplyAside part={lesson.apply} labels={labels.apply} />,
        action: <PrimaryAction primary={primary} />,
    }
}
