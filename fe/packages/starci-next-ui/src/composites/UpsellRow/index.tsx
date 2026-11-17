import { Button, Cluster, Text } from "@starci/grammar/common"

/** The upsell for a reader without Premium: the action's words, the line beside it and where it leads. */
export type UpsellRowProps = {
    readonly label: string
    readonly note: string
    readonly href: string
}

/** The one way to Premium: the commit action with the line that says what it unlocks, shared by the catalog and topic cards. */
export const UpsellRow = (props: UpsellRowProps) => (
    <Cluster gap="row" wrap align="center">
        <Button intent="commit" href={props.href}>
            {props.label}
        </Button>
        <Text tone="muted">{props.note}</Text>
    </Cluster>
)
