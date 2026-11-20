import { Badge, Button, Cluster, Input, Link, Section, Stack, Text } from "@starci/grammar/common"
import type { CardProps, ProjectDetailBusy, ProjectDetailFields } from "./types"

/** What the aside needs: the project, the words, the field of the new secret, the busy flags and the rotate command. */
type ProjectAsideProps = CardProps & {
    readonly fields: ProjectDetailFields
    readonly busy: ProjectDetailBusy
    readonly on: { readonly rotate: () => void }
}

/** The repository section: the link to the repo, or a line that none is linked. */
const RepoSection = (props: CardProps) => (
    <Section title={props.labels.asideRepo} headingLevel={2} isLoading={props.isLoading}>
        {props.view.repo === "" ? (
            <Text tone="muted">{props.labels.noRepo}</Text>
        ) : (
            <Link href={props.view.repo} kind="external">
                {props.view.repoLabel}
            </Link>
        )}
    </Section>
)

/** The CI attestation section: whether a signed run exists, which run, and what makes a run count. */
const CiSection = (props: CardProps) => (
    <Section title={props.labels.asideCi} headingLevel={2} isLoading={props.isLoading}>
        <Stack gap="row">
            <Cluster gap="inline" wrap align="center">
                <Badge isDot tone={props.view.ci.tone}>
                    {props.view.ci.label}
                </Badge>
            </Cluster>
            <Text tone="muted">{props.view.ciLine}</Text>
            <Text tone="muted">{props.labels.ciNote}</Text>
        </Stack>
    </Section>
)

/** The learner machine section: not connected, what its results are worth, and the way to connect. */
const DeviceSection = (props: CardProps) => (
    <Section title={props.labels.deviceTitle} headingLevel={2} isLoading={props.isLoading}>
        <Stack gap="row">
            <Cluster gap="inline" wrap align="center">
                <Badge isDot tone="muted">
                    {props.labels.deviceBadge}
                </Badge>
            </Cluster>
            <Text tone="muted">{props.labels.deviceNote}</Text>
            <Cluster gap="inline" wrap>
                <Button intent="neutral" href={props.labels.devicesHref}>
                    {props.labels.deviceConnect}
                </Button>
            </Cluster>
        </Stack>
    </Section>
)

/** The CI secret section: what it signs, the new secret once, and the rotate command. */
const SecretSection = (props: ProjectAsideProps) => (
    <Section title={props.labels.secretTitle} headingLevel={2} isLoading={props.isLoading}>
        <Stack gap="row">
            <Text tone="muted">{props.labels.secretText}</Text>
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
                <Button intent="neutral" isPending={props.busy.isRotating} onPress={props.on.rotate}>
                    {props.busy.isRotating ? props.labels.rotating : props.labels.rotate}
                </Button>
            </Cluster>
        </Stack>
    </Section>
)

/** The starci/ layout section: the tree, where tests live and how practice differs from proof. */
const LayoutSection = (props: CardProps) => (
    <Section title={props.labels.layoutTitle} headingLevel={2} isLoading={props.isLoading}>
        <Stack gap="row">
            <Stack gap="inline">
                {props.labels.layoutTree.split("
").map((line) => (
                    <Text key={line} mono>
                        {line}
                    </Text>
                ))}
            </Stack>
            <Text>{props.labels.layoutTests}</Text>
            <Text tone="muted">{props.labels.layoutTestsText}</Text>
            <Text tone="muted">{props.labels.layoutFlow}</Text>
        </Stack>
    </Section>
)

/** The aside: repository, CI attestation, the learner machine, the CI secret and the starci/ layout, one Section each on the same surface as the main column. */
export const ProjectAside = (props: ProjectAsideProps) => (
    <Stack gap="region">
        <RepoSection {...props} />
        <CiSection {...props} />
        <DeviceSection {...props} />
        <SecretSection {...props} />
        <LayoutSection {...props} />
    </Stack>
)
