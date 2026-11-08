import { Button, Cluster, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** The active path of the learner, already in words. */
export type HubPathView = {
    readonly title: string
    /** The next steps of the path, each one a short phrase. */
    readonly next: ReadonlyArray<string>
}

/** The fixed words of the path card. */
export type HubPathLabels = {
    readonly eyebrow: string
    readonly nextLabel: string
    readonly continue: string
    readonly change: string
    readonly emptyTitle: string
    readonly emptyBody: string
    readonly choose: string
}

/** The path card: the active path with the way to continue it, or the invitation to choose a goal when there is none. */
type HubPathCardProps = {
    /** The active path, or undefined when the learner follows none. */
    readonly view: HubPathView | undefined
    readonly labels: HubPathLabels
    /** Where the picker of goals lives. */
    readonly chooseHref: string
    /** Where the learner continues the active path. */
    readonly continueHref: string
    readonly isLoading?: boolean
}

/** The invitation shown while the learner follows no path. */
const EmptyPath = (props: Pick<HubPathCardProps, "labels" | "chooseHref" | "isLoading">) => (
    <SurfaceCard
        label={props.labels.eyebrow}
        footers={[{ kind: "more", label: props.labels.choose, href: props.chooseHref }]}
        {...(props.isLoading === true ? { isLoading: true } : {})}
    >
        <Stack gap="row">
            <Text as="p" size="md">
                {props.labels.emptyTitle}
            </Text>
            <Text tone="muted">{props.labels.emptyBody}</Text>
        </Stack>
    </SurfaceCard>
)

/** The active-path card, or the invitation to choose a goal. */
export const HubPathCard = (props: HubPathCardProps) => {
    const { view } = props
    if (view === undefined) return <EmptyPath {...props} />
    return (
        <SurfaceCard label={props.labels.eyebrow} {...(props.isLoading === true ? { isLoading: true } : {})}>
            <Stack gap="row">
                <Text as="p" size="md">
                    {view.title}
                </Text>
                {view.next.length === 0 ? null : (
                    <Text tone="muted">{`${props.labels.nextLabel}: ${view.next.join(" / ")}`}</Text>
                )}
                <Cluster gap="row">
                    <Button intent="commit" href={props.continueHref}>
                        {props.labels.continue}
                    </Button>
                    <Button intent="neutral" href={props.chooseHref}>
                        {props.labels.change}
                    </Button>
                </Cluster>
            </Stack>
        </SurfaceCard>
    )
}
