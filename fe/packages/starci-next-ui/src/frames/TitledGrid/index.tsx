import type { ReactElement, ReactNode } from "react"
import { Grid, Stack, Text } from "@starci/grammar/common"

/** A titled section whose body is a grid of peer cards, worded by its block. */
type TitledGridProps = {
    readonly title: string
    readonly subtitle: string
    /** The peer cards of the section. */
    readonly children: ReactNode
}

/** A titled section whose body is a grid of three peer cards a row. */
export const TitledGrid = (props: TitledGridProps): ReactElement => (
    <Stack gap="section">
        <Stack gap="identity">
            <Text as="p" size="md">
                {props.title}
            </Text>
            <Text tone="muted">{props.subtitle}</Text>
        </Stack>
        <Grid kind="cards" columns={3}>
            {props.children}
        </Grid>
    </Stack>
)
