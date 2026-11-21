import { Badge, Cluster, Heading, Stack } from "@starci/grammar/common"
import type { ReactNode } from "react"

/** What the hero of the entry pages draws: the welcome picture, one headline and the product areas as chips. */
type AuthHeroProps = {
    /** The welcome picture (the app draws it from `areaArt("auth")`). */
    readonly art: ReactNode
    readonly headline: string
    /** The accessible name of the chip row. */
    readonly chipsLabel: string
    readonly chips: ReadonlyArray<{ readonly id: string; readonly label: string }>
}

/** The left side of the entry frame: a welcome picture, one line, and the three areas as chips (no paragraphs). */
export const AuthHero = (props: AuthHeroProps) => (
    <Stack gap="section">
        {props.art}
        <Heading level={2} scale="title">
            {props.headline}
        </Heading>
        <Cluster gap="inline" label={props.chipsLabel}>
            {props.chips.map((chip) => (
                <Badge key={chip.id} tone={chip.id === "essentials" ? "accent" : "neutral"}>
                    {chip.label}
                </Badge>
            ))}
        </Cluster>
    </Stack>
)
