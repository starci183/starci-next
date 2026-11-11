import type { ReactNode } from "react"
import { Link, Meter, PaneSection, Text } from "@starci/grammar/common"

/** One related entry of the aside. */
export type TopicAsideEntry = {
    readonly id: string
    readonly title: string
    /** The destination, or empty for text only. */
    readonly href: string
}

/** The progress of the learner in the topic: a meter and its words. */
type TopicAsideProgress = {
    readonly label: string
    readonly value: number
    readonly max: number
    /** The learner's own progress in words (Premium only); empty hides it. */
    readonly note: string
}

/** The aside of a topic page; a block with nothing in it is left out. */
type TopicAsideProps = {
    readonly progressLabel: string
    readonly progress: TopicAsideProgress
    readonly prerequisitesLabel: string
    readonly prerequisites: ReadonlyArray<TopicAsideEntry>
    readonly relatedLabel: string
    readonly related: ReadonlyArray<TopicAsideEntry>
    /** The upsell for a reader without Premium: a muted line and a link; undefined hides it. */
    readonly upsell: { readonly note: string; readonly label: string; readonly href: string } | undefined
}

/** A titled block of the aside: its name (14, 500) and its content. */
type AsideBlockProps = { readonly title: string; readonly isFirst: boolean; readonly content: ReactNode }

/** The entries of a block. */
type EntriesProps = { readonly entries: ReadonlyArray<TopicAsideEntry> }

/** One section of the aside pane, set off from the one above by a hairline; its name and content stand one step apart. */
const AsideBlock = (props: AsideBlockProps) => (
    <PaneSection {...(props.isFirst ? {} : { rule: "start" as const })}>
        <Text as="p" isStrong>
            {props.title}
        </Text>
        {props.content}
    </PaneSection>
)

/** The entries of a block: a link for an entry with a destination, plain text otherwise. */
const Entries = (props: EntriesProps) =>
    props.entries.map((entry) =>
        entry.href === "" ? (
            <Text key={entry.id} as="p">
                {entry.title}
            </Text>
        ) : (
            <Link variant="plain" key={entry.id} href={entry.href}>
                {entry.title}
            </Link>
        ),
    )

/** The aside pane of a topic: progress, what to know first, related topics and, without Premium, the way to Premium; each shown only when the data carries it. */
export const TopicAside = (props: TopicAsideProps) => (
    <>
        <AsideBlock
            title={props.progressLabel}
            isFirst
            content={
                <>
                    <Meter
                        label={props.progress.label}
                        value={props.progress.value}
                        maxValue={Math.max(props.progress.max, 1)}
                        size="sm"
                    />
                    {props.progress.note === "" ? null : (
                        <Text size="sm" tone="muted">
                            {props.progress.note}
                        </Text>
                    )}
                    {props.upsell === undefined ? null : (
                        <>
                            <Text size="sm" tone="muted">
                                {props.upsell.note}
                            </Text>
                            <Link variant="plain" href={props.upsell.href}>{props.upsell.label}</Link>
                        </>
                    )}
                </>
            }
        />
        {props.prerequisites.length === 0 ? null : (
            <AsideBlock
                title={props.prerequisitesLabel}
                isFirst={false}
                content={<Entries entries={props.prerequisites} />}
            />
        )}
        {props.related.length === 0 ? null : (
            <AsideBlock title={props.relatedLabel} isFirst={false} content={<Entries entries={props.related} />} />
        )}
    </>
)
