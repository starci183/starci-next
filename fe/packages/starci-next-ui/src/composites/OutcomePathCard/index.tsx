import { Avatar, Badge, Button, Cluster, Heading, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** One outcome path as its card shows it, every word resolved. */
export type OutcomePathView = {
    readonly id: string
    /** The small line over the title: the kind of path (build a product, build an agent, get a job). */
    readonly kind: string
    readonly title: string
    readonly pitch: string
    /** The done outcome in one statement. */
    readonly done: string
    /** The parts the path strings together, in words. */
    readonly parts: ReadonlyArray<string>
    /** Steps and rough time in one line. */
    readonly meta: string
    /** The learner follows this path now. */
    readonly isCurrent: boolean
}

/** The fixed words of a path card. */
export type OutcomePathCardLabels = {
    /** The badge of the path the learner follows. */
    readonly current: string
    /** The term in front of the done outcome. */
    readonly doneLabel: string
    /** The command that opens the stages and checks. */
    readonly view: string
    /** The command that follows the path. */
    readonly choose: string
    /** The command that moves the learner from another path to this one. */
    readonly switchTo: string
}

/** A path card. */
type OutcomePathCardProps = {
    readonly path: OutcomePathView
    /** Whether the learner follows another path, so choosing this one is a switch. */
    readonly hasActive: boolean
    readonly labels: OutcomePathCardLabels
    /** The choice is being saved. */
    readonly isPending: boolean
    readonly isLoading?: boolean
    readonly onView: (id: string) => void
    readonly onChoose: (id: string) => void
}

/** The command that follows the path; the path already followed offers none. */
const ChooseAction = (props: Pick<OutcomePathCardProps, "path" | "hasActive" | "labels" | "isPending" | "onChoose">) =>
    props.path.isCurrent ? null : (
        <Button intent="commit" isPending={props.isPending} onPress={() => props.onChoose(props.path.id)}>
            {props.hasActive ? props.labels.switchTo : props.labels.choose}
        </Button>
    )

/**
 * One outcome path as a card: its kind, name, promise, the done outcome that ends it, the parts it strings together and its size,
 * with the commands to read its stages and to follow it.
 */
export const OutcomePathCard = (props: OutcomePathCardProps) => (
    <SurfaceCard
        ariaLabel={props.path.title}
        height="fill"
        {...(props.isLoading === true ? { isLoading: true } : {})}
        {...(props.path.isCurrent ? { emphasis: "accent" as const } : {})}
        footers={[
            {
                kind: "custom",
                children: (
                    <Cluster gap="row">
                        <Button intent="neutral" onPress={() => props.onView(props.path.id)}>
                            {props.labels.view}
                        </Button>
                        <ChooseAction {...props} />
                    </Cluster>
                ),
            },
        ]}
    >
        <Stack gap="row">
            <Cluster gap="inline" align="start" wrap={false}>
                <Avatar name={props.path.title} seed={props.path.id} />
                <Stack gap="identity">
                    <Text size="xs" tone="muted">
                        {props.path.kind}
                    </Text>
                    <Heading level={2}>{props.path.title}</Heading>
                </Stack>
            </Cluster>
            {props.path.isCurrent ? <Badge tone="accent">{props.labels.current}</Badge> : null}
            <Text as="p">{props.path.pitch}</Text>
            <Text as="p" size="sm">
                <Text as="span" size="sm" isStrong>
                    {`${props.labels.doneLabel}: `}
                </Text>
                {props.path.done}
            </Text>
            <Cluster gap="inline" wrap>
                {props.path.parts.map((part) => (
                    <Badge key={part} tone="neutral">
                        {part}
                    </Badge>
                ))}
            </Cluster>
            <Text size="sm" tone="muted">
                {props.path.meta}
            </Text>
        </Stack>
    </SurfaceCard>
)
