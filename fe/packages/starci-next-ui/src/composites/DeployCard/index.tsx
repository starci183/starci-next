import { Alert, Button, Cluster, Input, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import type { DeployCardProps } from "../ProjectAside/types"

/** The form that saves the deployed address and asks the server to probe it. */
export const DeployCard = (props: DeployCardProps) => {
    const { labels, busy, fields, view } = props
    return (
        <SurfaceCard kind="body" label={labels.deployTitle} isLoading={props.isLoading}>
            <Stack gap="row">
                <Text tone="muted">{labels.deployText}</Text>
                {fields.issueWords === "" ? null : <Alert tone="negative" title={fields.issueWords} />}
                <Input
                    id="project-deployed"
                    name="deployed"
                    label={labels.deployedLabel}
                    kind="text"
                    value={fields.deployed}
                    isDisabled={busy.isSaving}
                    onValueChange={props.on.deployed}
                />
                <Cluster gap="inline" wrap align="center">
                    <Button intent="neutral" isPending={busy.isSaving} onPress={props.on.saveDeployed}>
                        {labels.saveDeployed}
                    </Button>
                    <Button
                        intent="neutral"
                        isPending={busy.isProbing}
                        isDisabled={view.deployedUrl === "" || busy.isProbing}
                        onPress={props.on.runProbes}
                    >
                        {busy.isProbing ? labels.runningProbes : labels.runProbes}
                    </Button>
                </Cluster>
            </Stack>
        </SurfaceCard>
    )
}
