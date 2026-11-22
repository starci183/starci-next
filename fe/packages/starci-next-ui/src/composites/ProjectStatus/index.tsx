import { Badge, Button, Grid, Input, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import type { CardProps, ProjectDetailBusy, ProjectDetailFields } from "../ProjectAside/types"

/** What the four status tiles need: the project, the words, the secret handed once, the busy flags and the rotate command. */
type ProjectStatusProps = CardProps & {
    readonly fields: ProjectDetailFields
    readonly busy: ProjectDetailBusy
    readonly on: { readonly rotate: () => void }
}

/** The four status tiles of a project: the repository, the signed CI, the learner machine and the CI secret, each one word of state. */
export const ProjectStatus = (props: ProjectStatusProps) => {
    const { labels, view, fields, busy } = props
    const hasRun = view.ci.tone !== "muted"
    return (
        <Grid kind="cards" columns={4}>
            <SurfaceCard
                label={labels.asideRepo}
                headingLevel={3}
                isLoading={props.isLoading}
                state={view.repo === "" ? "neutral" : "affirmative"}
            >
                <Stack gap="inline">
                    <Badge isDot tone={view.repo === "" ? "muted" : "success"}>
                        {view.repo === "" ? labels.noRepo : labels.repoLinked}
                    </Badge>
                    <Text tone="muted">{view.repoLabel}</Text>
                </Stack>
            </SurfaceCard>
            <SurfaceCard label={labels.asideCi} headingLevel={3} isLoading={props.isLoading}>
                <Stack gap="inline">
                    <Badge isDot tone={view.ci.tone}>
                        {view.ci.label}
                    </Badge>
                    <Text tone="muted">{hasRun ? view.ciLine : labels.ciNote}</Text>
                </Stack>
            </SurfaceCard>
            <SurfaceCard
                label={labels.deviceTitle}
                headingLevel={3}
                isLoading={props.isLoading}
                wholeAction={{ kind: "link", href: labels.devicesHref, label: labels.deviceConnect }}
            >
                <Stack gap="inline">
                    <Badge isDot tone="accent">
                        {labels.deviceBadge}
                    </Badge>
                    <Text tone="muted">{labels.deviceNote}</Text>
                </Stack>
            </SurfaceCard>
            <SurfaceCard label={labels.secretTitle} headingLevel={3} isLoading={props.isLoading}>
                <Stack gap="inline">
                    {fields.secret === undefined ? (
                        <Text tone="muted">{labels.secretText}</Text>
                    ) : (
                        <Input
                            id="project-new-secret"
                            name="secret"
                            label={labels.newSecret}
                            kind="text"
                            value={fields.secret}
                            isReadOnly
                            isCopyable
                            copyLabel={labels.copy}
                            copiedLabel={labels.copied}
                        />
                    )}
                    <Button variant="border" size="sm" isPending={busy.isRotating} onPress={props.on.rotate}>
                        {busy.isRotating ? labels.rotating : labels.rotate}
                    </Button>
                </Stack>
            </SurfaceCard>
        </Grid>
    )
}
