import { Badge, Button, Cluster, Heading, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** A part of the agent lab that is not open yet, or a pointer to another part, already in words. */
type AgentSoonCardProps = {
    readonly title: string
    readonly description: string
    /** The status words (coming soon, not open); empty draws none. */
    readonly badge: string
    /** An action to somewhere else (the projects page); undefined draws none. */
    readonly action: { readonly label: string; readonly href: string } | undefined
}

/** A quiet card for what is coming (other tools, the optional StarCi harness capstone) or where the proof of an agent lives. */
export const AgentSoonCard = (props: AgentSoonCardProps) => (
    <SurfaceCard ariaLabel={props.title}>
        <Stack gap="row">
            <Cluster gap="inline" wrap align="center">
                <Heading level={2} scale="standard">
                    {props.title}
                </Heading>
                {props.badge === "" ? null : <Badge tone="muted">{props.badge}</Badge>}
            </Cluster>
            <Text as="p" tone="muted">
                {props.description}
            </Text>
            {props.action === undefined ? null : (
                <Cluster gap="inline" wrap>
                    <Button intent="commit" href={props.action.href}>
                        {props.action.label}
                    </Button>
                </Cluster>
            )}
        </Stack>
    </SurfaceCard>
)
