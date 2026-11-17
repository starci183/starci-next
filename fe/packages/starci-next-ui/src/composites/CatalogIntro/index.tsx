import { Badge, Cluster, Heading, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import type { ReactNode } from "react"
import { ArtBeside } from "../../frames/ArtBeside"
import { UpsellRow, type UpsellRowProps } from "../UpsellRow"

/** The words of the catalog intro, resolved by its block. */
type CatalogIntroProps = {
    /** The small line over the title (the kind of knowledge and how it is learned), already in words. */
    readonly eyebrow: string
    readonly title: string
    readonly description: string
    /** The facts under the description (published lessons, groups, sources still moving), already in words. */
    readonly facts: ReadonlyArray<string>
    /** The upsell for a reader without Premium; undefined hides it. */
    /** The decorative picture beside the text, already drawn; undefined leaves the card text only. */
    readonly art?: ReactNode
    readonly upsell: UpsellRowProps | undefined
}

/** The intro of the catalog: what it is, how much is open and, for a reader without Premium, the one way to Premium. */
export const CatalogIntro = (props: CatalogIntroProps) => (
    <SurfaceCard ariaLabel={props.title}>
        <ArtBeside art={props.art}>
            <Stack gap="row">
                <Stack gap="identity">
                    <Text size="sm" tone="muted">
                        {props.eyebrow}
                    </Text>
                    <Heading level={1} scale="title">
                        {props.title}
                    </Heading>
                </Stack>
                <Text as="p">{props.description}</Text>
                <Cluster gap="inline" wrap>
                    {props.facts.map((fact) => (
                        <Badge key={fact} tone="neutral">
                            {fact}
                        </Badge>
                    ))}
                </Cluster>
                {props.upsell === undefined ? null : <UpsellRow {...props.upsell} />}
            </Stack>
        </ArtBeside>
    </SurfaceCard>
)
