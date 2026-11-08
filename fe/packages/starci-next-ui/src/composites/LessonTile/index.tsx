import { SurfaceCard } from "@starci/grammar/common"

/** One lesson of the catalog, worded by its block. */
type LessonTileProps = {
    readonly id: string
    readonly title: string
    readonly description: string
    /** The difficulty, already in words. */
    readonly difficulty: string
    /** Where the learner stands on the lesson, already in words. */
    readonly status: string
    /** The facts of the lesson: minutes, then the languages or providers it has, already in words. */
    readonly facts: ReadonlyArray<string>
    /** The words of the whole-card link. */
    readonly openLabel: string
    readonly href: string
}

/** A lesson as one peer tile of the catalog: its name, what it teaches, how hard, how long and where the learner stands, the whole card opening it. */
export const LessonTile = (props: LessonTileProps) => (
    <SurfaceCard
        kind="tile"
        name={props.title}
        description={props.description}
        facts={props.facts}
        mark={{ avatar: { name: props.title, seed: props.id } }}
        badges={[{ label: props.difficulty }, { label: props.status, tone: "muted" }]}
        wholeAction={{ kind: "link", href: props.href, label: props.openLabel }}
    />
)
