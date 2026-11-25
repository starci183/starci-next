import { Button, Cluster, Link, Section, Stack, Text } from "@starci/grammar/common"
import { LockIcon } from "../../leaves/Icon"

/** One part the reader's plan does not include, as the row that names it. */
export type LockedPartTile = {
    readonly id: string
    /** "Tìm sạn". */
    readonly title: string
    /** One short line of what the part holds. */
    readonly note: string
    /** The part the reader stands on. */
    readonly isCurrent: boolean
}

/** The words and destinations of a part the reader's plan does not include. */
type LessonLockedPartProps = {
    /** "Premium", the name of the plan that holds the part. */
    readonly eyebrow: string
    /** "Tìm sạn thuộc gói Premium", or the guest's line to sign in. */
    readonly title: string
    /** What stays when the reader upgrades or signs in: the score and progress. */
    readonly description: string
    /** The parts that are locked, one row each. */
    readonly tiles: ReadonlyArray<LockedPartTile>
    /** The way to the comparison of the two plans; undefined draws none (a guest signs in first). */
    readonly compare: { readonly label: string; readonly href: string } | undefined
    /** The price line of the plan, under the rows; empty draws none. */
    readonly price: string
    /** The mark of the row of the part the reader opened ("Đang xem"). */
    readonly current: string
    /** The command of the notice (the header carries the same one on a wide screen). */
    readonly action: { readonly label: string; readonly href: string } | undefined
}

/**
 * A part the plan lacks, shown to a reader without it: one section for the four parts (the one the reader opened marked "đang xem"), what
 * stays when the plan changes and the way to compare plans. The plan's name carries the padlock of the locked tabs, never a run-state circle;
 * the title is a section title, so the four rows never outweigh it. The server sends the payload of a locked part to nobody, so there is no
 * preview.
 */
export const LessonLockedPart = (props: LessonLockedPartProps) => (
    <Stack gap="section">
        <Cluster gap="identity" align="center">
            <LockIcon label={props.eyebrow} />
            <Text tone="muted">{props.eyebrow}</Text>
        </Cluster>
        <Section
            kind="list"
            title={props.title}
            headingLevel={2}
            empty={props.description}
            items={props.tiles.map((tile) => ({
                id: tile.id,
                title: tile.title,
                description: tile.note,
                ...(tile.isCurrent ? { badges: [{ label: props.current, tone: "accent" as const }] as const } : {}),
            }))}
        />
        <Text as="p">{props.description}</Text>
        {props.price === "" && props.compare === undefined ? null : (
            <Text as="p">
                {props.price}
                {props.compare === undefined ? null : <Link href={props.compare.href}>{props.compare.label}</Link>}
            </Text>
        )}
        {props.action === undefined ? null : (
            <Stack gap="inline">
                <Button variant="primary" href={props.action.href}>
                    {props.action.label}
                </Button>
            </Stack>
        )}
    </Stack>
)
