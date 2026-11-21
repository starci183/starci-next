import { Alert, Button, Cluster, IconTile, PaneSection, Section, Stack, Text } from "@starci/grammar/common"
import { LockGlyph } from "../../leaves/Icon"
import type { ReactNode } from "react"
import { LessonCode } from "../LessonCode"
import { RichMarkdown } from "../RichMarkdown"
import { AnswerBar } from "./question"
import type { EssenceJourneyRow, EssenceLabels, EssenceView } from "./types"

export { LessonOpenerHead, LessonQuestion } from "./question"
export { LessonStoryCard, LessonStoryQuestion } from "./story"

export type {
    EssenceBarPart,
    EssenceInsight,
    EssenceJourneyRow,
    EssenceLabels,
    EssenceMiss,
    EssenceQuestionView,
    EssenceStage,
    EssenceStory,
    EssenceStoryEvent,
    EssenceTocRow,
    EssenceView,
} from "./types"

/** What the contents need. */
type LessonTocProps = { readonly view: EssenceView; readonly labels: EssenceLabels }

/** The contents of the article: a row per section, "read closely" on the ones a wrong answer pointed at, a check on the ones read. */
export const LessonToc = (props: LessonTocProps) => (
    <Section
        kind="list"
        ariaLabel={props.labels.toc.title}
        empty={props.labels.article.empty}
        items={props.view.toc.map((row, index) => ({
            id: row.id,
            title: `${index + 1}. ${row.title}`,
            href: row.href,
            ...(row.isRead ? { state: "affirmative" as const } : {}),
            ...(row.isFlagged
                ? { badges: [{ label: props.labels.toc.flagged, tone: "warning" as const }] as const }
                : {}),
        }))}
    />
)

/** What the result needs. */
type LessonResultProps = {
    readonly view: EssenceView
    readonly labels: EssenceLabels
    readonly onRead: () => void
    readonly onReview: () => void
}

/** The result of the five answers: the bar and score, which sections to read closely, the contents and the two ways on. */
export const LessonResult = (props: LessonResultProps) => (
    <Stack gap="section">
        <Stack gap="inline">
            <Text tone="muted">{props.labels.result.eyebrow}</Text>
            <AnswerBar label={props.labels.opener.barLabel} bar={props.view.bar} isLoading={false} />
            <Text as="p" isStrong>
                {props.view.isPassed ? props.labels.result.passed : props.view.resultTitle}
            </Text>
            {props.view.retakeLine === "" ? null : <Text tone="muted">{props.view.retakeLine}</Text>}
            <Text>{props.view.resultText}</Text>
        </Stack>
        <LessonToc view={props.view} labels={props.labels} />
        <Cluster gap="inline">
            <Button intent="neutral" onPress={props.onRead}>
                {props.labels.result.readArticle}
            </Button>
            <Button intent="neutral" onPress={props.onReview}>
                {props.labels.result.review}
            </Button>
        </Cluster>
        {props.view.isFree ? (
            <Alert
                tone="accent"
                leading={<IconTile source={LockGlyph} />}
                title={props.labels.result.freeTitle}
                description={props.labels.result.freeText}
            />
        ) : null}
    </Stack>
)

/** What the article needs. */
type LessonArticleBodyProps = { readonly view: EssenceView; readonly labels: EssenceLabels }

/** What the right column needs. */
type LessonEssenceAsideProps = { readonly view: EssenceView; readonly labels: EssenceLabels }

/** The article: its eyebrow, the contents, then every section in order, each its own anchor so a wrong answer can link to it. */
export const LessonArticleBody = (props: LessonArticleBodyProps) => (
    <Stack gap="section">
        {props.view.articleEyebrow === "" ? null : <Text tone="muted">{props.view.articleEyebrow}</Text>}
        <LessonToc view={props.view} labels={props.labels} />
        {props.view.sections.map((section) => (
            <Section key={section.id} title={section.title} headingLevel={2} id={`section-${section.id}`}>
                {section.isLocked ? (
                    <Text tone="muted">{props.labels.article.locked}</Text>
                ) : (
                    <RichMarkdown
                        source={section.markdown}
                        labels={props.labels.markdown}
                        renderCode={(code) => <LessonCode code={code} />}
                    />
                )}
            </Section>
        ))}
    </Stack>
)

/** One block of the right column: its name then its content, set off from the one above by a hairline. */
type AsideBlockProps = { readonly title: string; readonly isFirst: boolean; readonly content: ReactNode }

/** One block of the aside. */
const AsideBlock = (props: AsideBlockProps) => (
    <PaneSection {...(props.isFirst ? {} : { rule: "start" as const })}>
        <Text as="p" isStrong>
            {props.title}
        </Text>
        {props.content}
    </PaneSection>
)

/** The state a journey row shows. */
const stateOf = (row: EssenceJourneyRow) => {
    if (row.isLocked) return "unavailable" as const
    return row.isDone ? ("affirmative" as const) : ("neutral" as const)
}

/** The four parts of the lesson as the journey lists them; a part the reader's plan lacks is an unavailable row. */
const journeyItems = (rows: ReadonlyArray<EssenceJourneyRow>) =>
    rows.map((row, index) => ({
        id: row.id,
        title: `${index + 1} · ${row.title}`,
        state: stateOf(row),
    }))

/** The right column of essence on wide screens: the four parts of the lesson and the reminder to answer the five again. */
export const LessonEssenceAside = (props: LessonEssenceAsideProps) => (
    <>
        <AsideBlock
            title={props.labels.aside.journeyTitle}
            isFirst
            content={
                <Section
                    kind="list"
                    ariaLabel={props.labels.aside.journeyTitle}
                    empty={props.labels.aside.journeyNote}
                    {...(props.view.isFree ? { caption: props.labels.aside.journeyNote } : {})}
                    items={journeyItems(props.view.journey)}
                />
            }
        />
        <AsideBlock
            title={props.labels.aside.retakeTitle}
            isFirst={false}
            content={<Text tone="muted">{props.labels.aside.retakeText}</Text>}
        />
    </>
)
