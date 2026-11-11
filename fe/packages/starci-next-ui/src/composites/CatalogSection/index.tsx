import { SurfaceCard } from "@starci/grammar/common"

/** One lesson of a group, already in words; without `href` the row is announced only (a case study that is not open yet). */
type CatalogCard = {
    readonly id: string
    readonly title: string
    readonly description: string
    readonly difficulty: string
    readonly status: string
    readonly facts: ReadonlyArray<string>
    readonly href: string | undefined
}

/** One topic of a group, already in words. */
type CatalogTopic = {
    readonly id: string
    readonly eyebrow: string
    readonly title: string
    readonly source: string
    readonly openLabel: string
    readonly preview: ReadonlyArray<{ readonly id: string; readonly title: string; readonly isOpen: boolean }>
    readonly status: string
    /** The chapter's 3D cover as a thumbnail (decorative); empty leaves the row without one. */
    readonly cover?: string
    readonly progress: number
    readonly href: string
}

/** One group of the catalog: topic rows in the default view, lesson rows while a search or a filter is active. */
export type CatalogNode = {
    readonly id: string
    readonly label: string
    readonly meta: string
    readonly topics: ReadonlyArray<CatalogTopic>
    readonly cards: ReadonlyArray<CatalogCard>
    /** What is still being moved into the group, already in words; empty hides it. */
    readonly pending: string
    /** True while the first read runs: the card draws its rows as geometry. */
    readonly isLoading?: boolean
}

/** A group with the words of its rows. */
type CatalogSectionProps = {
    readonly node: CatalogNode
}

/** The rows of a group: its topics, else its lessons. */
const rowsOf = (node: CatalogNode) =>
    node.topics.length > 0
        ? node.topics.map((topic) => ({
              id: topic.id,
              title: topic.title,
              ...(topic.cover === undefined || topic.cover === ""
                  ? {}
                  : { leading: { avatar: { name: topic.title, src: topic.cover, shape: "rounded" as const }, size: "md" as const } }),
              ...(topic.source === "" ? {} : { description: topic.source }),
              badges: [{ label: topic.status, tone: "muted" as const }] as const,
              meta: { text: topic.openLabel },
              href: topic.href,
          }))
        : node.cards.map((card) => ({
              id: card.id,
              title: card.title,
              description: card.description,
              badges: [{ label: card.difficulty }, { label: card.status, tone: "muted" as const }] as const,
              ...(card.facts.length === 0 ? {} : { meta: { text: card.facts.join(" · ") } }),
              ...(card.href === undefined ? {} : { href: card.href }),
          }))

/** A group of the catalog: one list card with a row per topic or lesson, its name on the well above it with the count chip, what is still to come under it. */
export const CatalogSection = (props: CatalogSectionProps) => (
    <SurfaceCard
        kind="list"
        label={props.node.label}
        fact={props.node.meta}
        empty={props.node.label}
        items={rowsOf(props.node)}
        {...(props.node.pending === "" ? {} : { note: props.node.pending })}
        {...(props.node.isLoading === true ? { isLoading: true } : {})}
    />
)
