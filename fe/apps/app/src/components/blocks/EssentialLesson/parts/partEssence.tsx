import { Button, Stack } from "@starci/grammar/common"
import { LessonArticleBody, LessonEssenceAside, LessonOpenerHead, LessonQuestion, LessonResult } from "@starci-next/ui"
import type { PartContext, PartLayout, PartLayoutOf } from "../layout"

/** The one primary the header carries for the stage on screen of essence. */
const actionOf = ({ lesson, screen }: PartContext) => {
    const { essence } = lesson
    const { shell } = screen.props
    const on = screen.on
    const last = essence.questions.length - 1
    if (essence.stage === "questions") {
        const current = essence.questions[essence.index]
        const isGraded = current?.status === "graded"
        if (!isGraded)
            return (
                <Button intent="commit" isDisabled>
                    {shell.nextQuestion}
                </Button>
            )
        if (essence.index < last) {
            return (
                <Button intent="commit" onPress={() => on.moveOpener(essence.index + 1)}>
                    {shell.questionNumber(essence.index + 2)}
                </Button>
            )
        }
        return (
            <Button intent="commit" onPress={() => on.showStage("result")}>
                {shell.seeResult}
            </Button>
        )
    }
    if (essence.stage === "result") {
        if (lesson.isFree && essence.retakeLine !== "") {
            return (
                <Button intent="commit" href={screen.props.plansHref}>
                    {shell.upgrade}
                </Button>
            )
        }
        return (
            <Button intent="commit" onPress={() => on.showStage("article")}>
                {shell.readArticle}
            </Button>
        )
    }
    return (
        <Button intent="commit" onPress={on.retake}>
            {shell.retake}
        </Button>
    )
}

/** The article under the questions: its eyebrow, the contents and every section. */
const ArticleBlock = ({ lesson, screen }: PartContext) => (
    <LessonArticleBody view={lesson.essence} labels={screen.props.essence} />
)

/** The body of the stage on screen: the question and the article below it, the result, or the article alone. */
const mainOf = (context: PartContext) => {
    const { lesson, screen, isLoading } = context
    const { essence } = lesson
    const labels = screen.props.essence
    if (essence.stage === "result") {
        return (
            <LessonResult
                view={essence}
                labels={labels}
                onRead={() => screen.on.showStage("article")}
                onReview={() => screen.on.moveOpener(0)}
            />
        )
    }
    const question = essence.questions[essence.index]
    if (essence.stage === "article" || question === undefined) return <ArticleBlock {...context} />
    return (
        <Stack gap="region">
            <Stack gap="section">
                <LessonOpenerHead view={essence} labels={labels} isLoading={isLoading} />
                <LessonQuestion question={question} labels={labels} isLoading={isLoading} onAnswer={screen.on.answer} />
            </Stack>
            <ArticleBlock {...context} />
        </Stack>
    )
}

/** essence: the five opener questions, then the article with its contents; the right column keeps the four parts and the retake reminder. */
export const essenceLayout: PartLayoutOf = (context): PartLayout => ({
    main: mainOf(context),
    aside: <LessonEssenceAside view={context.lesson.essence} labels={context.screen.props.essence} />,
    action: actionOf(context),
})
