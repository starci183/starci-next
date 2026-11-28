import { Cluster, Stack, Text } from "@starci/grammar/common"
import type { ReactNode } from "react"

/** One line of a read-only list: its 20 mark (an IconTile at the item size), its words, and a muted line under them. */
export type ItemLineView = {
    readonly id: string
    readonly mark: ReactNode
    readonly title: ReactNode
    readonly description?: ReactNode
    /** Block content under the words (a note, its meta and links), drawn as given, never inside the description's paragraph. */
    readonly detail?: ReactNode
}

/**
 * COMPOSITE - the lines of a list a reader only reads (owner 2026-11-28, the tile sizes: a row you press is 40, a line you read is 20, a page
 * head is 48): each line its round 20 mark, its words beside it, and its muted line under them. A list of rows to press stays Grammar's
 * list section (its 40 leading tile).
 */
export const ItemLines = (props: { readonly lines: ReadonlyArray<ItemLineView> }) => (
    <Stack gap="row">
        {props.lines.map((line) => (
            <Cluster key={line.id} gap="inline" align="start" wrap={false}>
                {line.mark}
                <Stack gap="identity">
                    <Text as="p">{line.title}</Text>
                    {line.description === undefined ? null : (
                        <Text as="p" role="caption" tone="muted">
                            {line.description}
                        </Text>
                    )}
                    {line.detail ?? null}
                </Stack>
            </Cluster>
        ))}
    </Stack>
)
