import { Link, Progress, Section, Stack } from "@starci/grammar/common"
import { LessonList, type LessonListRow } from "../LessonList"

/** One topic of the catalog: its head, its bar and the lessons that pass the toolbar. */
type CatalogGroupData = {
    readonly id: string
    readonly title: string
    /** "2/6 lessons done". */
    readonly progressLabel: string
    /** Lessons done over the lessons of the topic, 0 to 100. */
    readonly percent: number
    readonly href: string
    readonly lessons: ReadonlyArray<LessonListRow>
    /** The link under the list (for example "See all 6 lessons"); empty hides it. */
    readonly moreLabel: string
}

/** Props of one group. */
type CatalogGroupProps = {
    readonly group: CatalogGroupData
    /** The words of the link to the topic in the head (for example "View topic"). */
    readonly viewTopic: string
    readonly isLoading?: boolean
}

/** The width the bar of a topic takes under its head, short like the four-part meters of the rows. */
const BAR_WIDTH = "7.5rem"

/**
 * A topic of the catalog: a region on the surface whose head carries the topic name, how many of its lessons are done and the link
 * to the topic, with the bar of those lessons under it, then the lesson rows and, when more stand in the topic, the link to all of them.
 */
export const CatalogGroup = (props: CatalogGroupProps) => (
    <Section
        kind="region"
        title={props.group.title}
        headingLevel={2}
        fact={props.group.progressLabel}
        action={
            <Link variant="head" href={props.group.href}>
                {props.viewTopic}
            </Link>
        }
        {...(props.isLoading === true ? { isLoading: true } : {})}
    >
        <Stack gap="inline">
            <span style={{ display: "block", width: BAR_WIDTH }}>
                <Progress
                    label={props.group.progressLabel}
                    value={props.group.percent}
                    tone="foreground"
                    {...(props.isLoading === true ? { isLoading: true } : {})}
                />
            </span>
            <LessonList
                ariaLabel={props.group.title}
                rows={props.group.lessons}
                empty={props.group.progressLabel}
                {...(props.isLoading === true ? { isLoading: true } : {})}
            />
            {props.group.moreLabel === "" ? null : <Link href={props.group.href}>{props.group.moreLabel}</Link>}
        </Stack>
    </Section>
)
