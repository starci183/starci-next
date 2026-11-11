import { Badge, Button, Cluster, Divider, Input, Link, Stack, Text } from "@starci/grammar/common"
import type { CardProps } from "./cards"
import type { ProjectDetailBusy, ProjectDetailFields } from "./types"

/** What the aside needs: the project, the words, the field of the new secret, the busy flags and the rotate command. */
export type ProjectAsideProps = CardProps & {
    readonly fields: ProjectDetailFields
    readonly busy: ProjectDetailBusy
    readonly on: { readonly rotate: () => void }
}

/** The repository section: the link to the repo, or a line that none is linked. */
const RepoSection = (props: CardProps) => (
    <Stack gap="row">
        <Text isStrong>{props.labels.asideRepo}</Text>
        {props.view.repo === "" ? (
            <Text tone="muted">{props.labels.noRepo}</Text>
        ) : (
            <Link variant="plain" href={props.view.repo} kind="external">
                {props.view.repoLabel}
            </Link>
        )}
    </Stack>
)

/** The CI attestation section: whether a signed run exists, which run, and what makes a run count. */
const CiSection = (props: CardProps) => (
    <Stack gap="row">
        <Text isStrong>{props.labels.asideCi}</Text>
        <Cluster gap="inline" wrap align="center">
            <Badge isDot tone={props.view.ci.tone}>
                {props.view.ci.label}
            </Badge>
        </Cluster>
        <Text size="sm" tone="muted">
            {props.view.ciLine}
        </Text>
        <Text size="sm" tone="muted">
            {props.labels.ciNote}
        </Text>
    </Stack>
)

/** The learner machine section: not connected, what its results are worth, and the way to connect. */
const DeviceSection = (props: CardProps) => (
    <Stack gap="row">
        <Text isStrong>{props.labels.deviceTitle}</Text>
        <Cluster gap="inline" wrap align="center">
            <Badge isDot tone="muted">
                {props.labels.deviceBadge}
            </Badge>
        </Cluster>
        <Text size="sm" tone="muted">
            {props.labels.deviceNote}
        </Text>
        <Cluster gap="inline" wrap>
            <Button intent="neutral" size="sm" href={props.labels.devicesHref}>
                {props.labels.deviceConnect}
            </Button>
        </Cluster>
    </Stack>
)

/** The CI secret section: what it signs, the new secret once, and the rotate command. */
const SecretSection = (props: ProjectAsideProps) => (
    <Stack gap="row">
        <Text isStrong>{props.labels.secretTitle}</Text>
        <Text size="sm" tone="muted">
            {props.labels.secretText}
        </Text>
        {props.fields.secret === undefined ? null : (
            <Input
                id="project-new-secret"
                name="secret"
                label={props.labels.newSecret}
                kind="text"
                value={props.fields.secret}
                isReadOnly
                isCopyable
                copyLabel={props.labels.copy}
                copiedLabel={props.labels.copied}
            />
        )}
        <Cluster gap="inline" wrap>
            <Button intent="neutral" size="sm" isPending={props.busy.isRotating} onPress={props.on.rotate}>
                {props.busy.isRotating ? props.labels.rotating : props.labels.rotate}
            </Button>
        </Cluster>
    </Stack>
)

/** The starci/ layout section: the tree, where tests live and how practice differs from proof. */
const LayoutSection = (props: CardProps) => (
    <Stack gap="row">
        <Text isStrong>{props.labels.layoutTitle}</Text>
        {props.labels.layoutTree.split("\n").map((line) => (
            <Text key={line} size="sm" mono>
                {line}
            </Text>
        ))}
        <Text isStrong>{props.labels.layoutTests}</Text>
        <Text size="sm" tone="muted">
            {props.labels.layoutTestsText}
        </Text>
        <Text size="sm" tone="muted">
            {props.labels.layoutFlow}
        </Text>
    </Stack>
)

/** The aside pane: repository, CI attestation, the learner machine, the CI secret and the starci/ layout, as sections divided by lines. */
export const ProjectAside = (props: ProjectAsideProps) => (
    <Stack gap="section">
        <RepoSection {...props} />
        <Divider semantics="presentation" />
        <CiSection {...props} />
        <Divider semantics="presentation" />
        <DeviceSection {...props} />
        <Divider semantics="presentation" />
        <SecretSection {...props} />
        <Divider semantics="presentation" />
        <LayoutSection {...props} />
    </Stack>
)
