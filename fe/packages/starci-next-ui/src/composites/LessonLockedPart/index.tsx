import { Alert, Button, Cluster, IconTile, Link, Section, Stack } from "@starci/grammar/common"
import { LockGlyph } from "../../leaves/Icon"

/** The words and destinations of a part the reader's plan does not include. */
type LessonLockedPartProps = {
    /** "Part 2 · Source is a Premium part". */
    readonly title: string
    /** What stays when the reader upgrades: the score and progress. */
    readonly description: string
    /** "What this part has". */
    readonly listTitle: string
    /** What the part holds, one line each. */
    readonly contents: ReadonlyArray<string>
    readonly backLabel: string
    /** The destination of part 1. */
    readonly backHref: string
    readonly compareLabel: string
    /** The destination of the page that compares the two plans. */
    readonly compareHref: string
}

/**
 * A part Premium unlocks, shown to a reader without it: one notice that says which part and why (nothing is lost, the score and
 * progress stay), the way back to part 1 and to the comparison of the two plans, then what the part holds. The server sends the
 * part's payload to nobody without Premium, so there is nothing to preview beyond these words.
 */
export const LessonLockedPart = (props: LessonLockedPartProps) => (
    <Stack gap="region">
        <Stack gap="row">
            <Alert
                tone="accent"
                leading={<IconTile source={LockGlyph} />}
                title={props.title}
                description={props.description}
            />
            <Cluster gap="inline">
                <Button intent="neutral" href={props.backHref}>
                    {props.backLabel}
                </Button>
                <Link href={props.compareHref}>{props.compareLabel}</Link>
            </Cluster>
        </Stack>
        <Section
            kind="list"
            title={props.listTitle}
            headingLevel={2}
            empty={props.listTitle}
            items={props.contents.map((line, index) => ({
                id: `line-${index}`,
                title: line,
                leading: { position: index + 1 },
            }))}
        />
    </Stack>
)
