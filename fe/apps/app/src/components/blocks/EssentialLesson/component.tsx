import { Badge, Button, EmptyNotice, Page, Stack, type PageHeaderContent } from "@starci/grammar/common"
import {
    EssentialApply,
    EssentialArticle,
    EssentialOpener,
    EssentialPartIntro,
    EssentialRetake,
    EssentialScenarios,
    EssentialSource,
    LockedNotice,
    SlotView,
} from "@starci-next/ui"
import type { EssentialLessonScreen, EssentialLessonView } from "@/hooks/essentialLesson"
import type { DataSlot } from "@/modules/types"

/** Props for {@link EssentialLessonBase}: the resolved props and the actions of the screen. */
export type EssentialLessonBaseProps = {
    readonly props: EssentialLessonScreen["props"]
    readonly on: EssentialLessonScreen["on"]
}

/** The lesson the band draws: the settled one, the placeholder while the first read runs, none otherwise. */
const lessonOfSlot = (
    slot: DataSlot<EssentialLessonView>,
    placeholder: EssentialLessonView,
): EssentialLessonView | undefined => {
    if ("items" in slot) return slot.items
    if ("isLoading" in slot) return placeholder
    return undefined
}

/** The band: the trail from the catalog through the topic, the title, the level chip, the facts and the four parts as page tabs. */
const bandOf = (lesson: EssentialLessonView, props: EssentialLessonBaseProps): PageHeaderContent => ({
    breadcrumbs: {
        label: props.props.page.breadcrumbs,
        items: [
            { id: "essentials", label: props.props.page.pageTitle, href: props.props.catalogHref },
            { id: "topic", label: lesson.topic.title, href: lesson.topic.href },
            { id: "lesson", label: lesson.title },
        ],
    },
    title: lesson.title,
    titleScale: "standard",
    status: <Badge>{lesson.difficulty}</Badge>,
    meta: lesson.facts,
    tabs: {
        label: props.props.page.tabs,
        kind: "views",
        items: lesson.tabs.map((tab) => ({ id: tab.id, label: tab.label })),
        selectedKey: lesson.part,
        onSelect: (key) => {
            const tab = lesson.tabs.find((each) => each.id === key)
            if (tab !== undefined) props.on.openPart(tab.id)
        },
    },
})

/** The part on screen. */
const PartBody = (props: { readonly lesson: EssentialLessonView; readonly screen: EssentialLessonBaseProps }) => {
    const { lesson } = props
    const { labels, plansHref, page } = props.screen.props
    const on = props.screen.on
    if (lesson.isLocked) {
        return (
            <LockedNotice
                title={labels.locked.title}
                description={labels.locked.description}
                plansLabel={labels.locked.plans}
                plansHref={plansHref}
            />
        )
    }
    if (lesson.part === "essence") {
        return (
            <Stack gap="region">
                {lesson.opener.questions.length === 0 ? null : (
                    <EssentialOpener
                        opener={lesson.opener}
                        labels={labels}
                        plansHref={plansHref}
                        onPick={on.pick}
                        onSubmit={on.submit}
                        onMove={on.moveOpener}
                    />
                )}
                <EssentialArticle sections={lesson.article} labels={labels} />
                {lesson.compare.length === 0 ? null : (
                    <EssentialRetake rows={lesson.compare} labels={labels} onStart={on.retake} />
                )}
            </Stack>
        )
    }
    if (lesson.isEmpty) return <EmptyNotice message={page.soon} />
    const intro = lesson.intro === undefined ? null : <EssentialPartIntro section={lesson.intro} labels={labels} />
    if (lesson.part === "source")
        return (
            <Stack gap="region">
                <EssentialSource source={lesson.source} labels={labels} />
                {intro}
            </Stack>
        )
    if (lesson.part === "scenarios")
        return (
            <Stack gap="region">
                <EssentialScenarios part={lesson.scenarios} labels={labels} onSelect={on.selectScenario} />
                {intro}
            </Stack>
        )
    return (
        <Stack gap="region">
            <EssentialApply
                part={lesson.apply}
                labels={labels}
                plansHref={plansHref}
                onSelect={on.selectChallenge}
                onPick={on.pick}
                onSubmit={on.submit}
            />
            {intro}
        </Stack>
    )
}

/**
 * One Bản chất lesson in four parts, the page tabs of its band (`?part=`): Bản chất (the five-question opener, the article,
 * the same five again), Source (pull, architecture, code walk), Kịch bản (scenarios run on the learner's machine, results over
 * the relay, the fix handed to the learner's AI) and Tự áp dụng (the challenge ladder). The opener is free; the rest needs Premium.
 */
export const EssentialLessonBase = (props: EssentialLessonBaseProps) => {
    const { slot, placeholder, slotLabels, plansHref, labels } = props.props
    const lesson = lessonOfSlot(slot, placeholder)
    return (
        <Page isLoading={"isLoading" in slot} {...(lesson === undefined ? {} : { header: bandOf(lesson, props) })}>
            <SlotView
                slot={slot}
                placeholder={placeholder}
                labels={slotLabels}
                forbiddenAction={
                    <Button intent="commit" href={plansHref}>
                        {labels.locked.plans}
                    </Button>
                }
                onRetry={props.on.retry}
                render={(each) => <PartBody lesson={each} screen={props} />}
            />
        </Page>
    )
}
