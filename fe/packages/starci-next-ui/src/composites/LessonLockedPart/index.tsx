import { LockClosedIcon } from "@heroicons/react/24/outline"
import { Button, Cluster, Grid, Heading, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import type { ReactNode } from "react"

/** One part the reader's plan does not include, as the card that names it. */
export type LockedPartTile = {
    readonly id: string
    /** "Tìm sạn". */
    readonly title: string
    /** One short line of what the part holds. */
    readonly note: string
    /** The part the reader stands on. */
    readonly isCurrent: boolean
}

/** The words, picture and destinations of a part the reader's plan does not include. */
type LessonLockedPartProps = {
    /** The 3D picture of the lock, already drawn. */
    readonly art: ReactNode
    /** "Phần 2 đến 5 thuộc Premium", or the guest's line to sign in. */
    readonly title: string
    /** What stays when the reader upgrades or signs in: the score and progress. */
    readonly description: string
    /** The parts that are locked, one card each. */
    readonly tiles: ReadonlyArray<LockedPartTile>
    /** The way to the comparison of the two plans; undefined draws none (a guest signs in first). */
    readonly compare: { readonly label: string; readonly href: string } | undefined
}

/**
 * A part the plan lacks, shown to a reader without it: the picture of a lock beside what stays (score and progress) and the way to
 * compare plans, then one card per locked part. The server sends the payload of a locked part to nobody, so there is no preview.
 */
export const LessonLockedPart = (props: LessonLockedPartProps) => (
    <Stack gap="region">
        <Grid
            kind="pair"
            leading={props.art}
            trailing={
                <Stack gap="row">
                    <Heading level={2}>{props.title}</Heading>
                    <Text tone="muted">{props.description}</Text>
                    {props.compare === undefined ? null : (
                        <Cluster gap="inline">
                            <Button intent="neutral" href={props.compare.href}>
                                {props.compare.label}
                            </Button>
                        </Cluster>
                    )}
                </Stack>
            }
        />
        <Grid kind="cards" columns={4}>
            {props.tiles.map((tile) => (
                <SurfaceCard
                    key={tile.id}
                    kind="tile"
                    name={tile.title}
                    description={tile.note}
                    mark={{ icon: LockClosedIcon }}
                    state="unavailable"
                />
            ))}
        </Grid>
    </Stack>
)
