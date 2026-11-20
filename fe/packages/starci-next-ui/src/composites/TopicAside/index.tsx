import type { ReactNode } from "react"
import { Link, PaneSection, Section, Text } from "@starci/grammar/common"

/** One entry of the aside: a name and, when it leads somewhere, its destination. */
type TopicAsideEntry = {
    readonly id: string
    readonly title: string
    /** The destination, or empty for text only. */
    readonly href: string
}

/** One of the four parts of a lesson as the aside lists it. */
type TopicAsidePart = {
    readonly id: string
    readonly title: string
    /** True when the reader's plan does not include the part. */
    readonly isLocked: boolean
}

/** The aside pane of a topic page; a block with nothing in it is left out. */
type TopicAsideProps = {
    readonly partsTitle: string
    readonly partsNote: string
    readonly parts: ReadonlyArray<TopicAsidePart>
    readonly prerequisitesTitle: string
    readonly prerequisites: ReadonlyArray<TopicAsideEntry>
    readonly relatedTitle: string
    readonly related: ReadonlyArray<TopicAsideEntry>
    /** The first read is running: every block draws as a skeleton. */
    readonly isLoading?: boolean
}

/** A titled block of the aside: its name (14, 500) and its content, set off from the one above by a hairline. */
type AsideBlockProps = {
    readonly title: string
    readonly isFirst: boolean
    readonly content: ReactNode
    readonly isLoading: boolean
}

/** What the entries of a block need. */
type EntriesProps = { readonly entries: ReadonlyArray<TopicAsideEntry> }

/** One section of the aside pane: its name and content stand one step apart. */
const AsideBlock = (props: AsideBlockProps) => (
    <PaneSection
        {...(props.isFirst ? {} : { rule: "start" as const })}
        {...(props.isLoading ? { isLoading: true } : {})}
    >
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

/**
 * The aside pane of a topic: the four parts every lesson has (the ones the reader's plan lacks are unavailable rows), what to know
 * first and the related topics. Sections between hairlines, never cards.
 */
export const TopicAside = (props: TopicAsideProps) => (
    <>
        <AsideBlock
            title={props.partsTitle}
            isFirst
            isLoading={props.isLoading === true}
            content={
                <Section
                    kind="list"
                    isLoading={props.isLoading === true}
                    ariaLabel={props.partsTitle}
                    empty={props.partsNote}
                    caption={props.partsNote}
                    items={props.parts.map((part, index) => ({
                        id: part.id,
                        title: `${index + 1} · ${part.title}`,
                        state: part.isLocked ? ("unavailable" as const) : ("neutral" as const),
                    }))}
                />
            }
        />
        {props.prerequisites.length === 0 ? null : (
            <AsideBlock
                title={props.prerequisitesTitle}
                isFirst={false}
                isLoading={props.isLoading === true}
                content={<Entries entries={props.prerequisites} />}
            />
        )}
        {props.related.length === 0 ? null : (
            <AsideBlock
                title={props.relatedTitle}
                isFirst={false}
                isLoading={props.isLoading === true}
                content={<Entries entries={props.related} />}
            />
        )}
    </>
)
