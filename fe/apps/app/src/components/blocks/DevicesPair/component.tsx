import {
    Alert,
    Badge,
    Button,
    Cluster,
    FencedCodeBlock,
    Heading,
    Input,
    Page,
    Stack,
    SurfaceCard,
    Text,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** One install or sign-in step of the pairing guide. */
export type DevicesPairStep = { readonly title: string; readonly command: string | undefined; readonly note: string }

/** One rule of what the CLI may and may not do. */
export type DevicesPairRule = { readonly text: string; readonly isAllowed: boolean }

/** One paired device, already in words. */
export type DevicesPairDevice = {
    readonly id: string
    readonly name: string
    readonly detail: string
    readonly isOnline: boolean
    readonly isRevoking: boolean
}

/** The pending pairing the learner is about to confirm, in words. */
export type DevicesPairPreview = { readonly name: string; readonly detail: string }

/** The fixed words of the devices screen. */
export type DevicesPairLabels = {
    readonly eyebrow: string
    readonly title: string
    readonly intro: string
    readonly codeLabel: string
    readonly codePlaceholder: string
    readonly codeHint: string
    readonly codeUnknown: string
    readonly previewTitle: string
    readonly confirm: string
    readonly confirming: string
    readonly devicesTitle: string
    readonly devicesLimit: string
    readonly online: string
    readonly offline: string
    readonly revoke: string
    readonly rulesTitle: string
}

/** Props for {@link DevicesPairBase}. */
export type DevicesPairBaseProps = {
    readonly props: {
        readonly labels: DevicesPairLabels
        readonly slotLabels: SlotLabels
        readonly steps: ReadonlyArray<DevicesPairStep>
        readonly rules: ReadonlyArray<DevicesPairRule>
        readonly code: string
        readonly preview: DevicesPairPreview | undefined
        readonly isCodeUnknown: boolean
        readonly canConfirm: boolean
        readonly isConfirming: boolean
        /** The words of the outcome of the last confirm or revoke; empty for none. */
        readonly notice: string
        readonly isNoticeError: boolean
        readonly devices: DataSlot<ReadonlyArray<DevicesPairDevice>>
        readonly placeholder: ReadonlyArray<DevicesPairDevice>
    }
    readonly on: {
        readonly changeCode: (value: string) => void
        readonly confirm: () => void
        readonly revoke: (id: string) => void
        readonly retry: () => void
    }
}

/** The fake device list with the geometry of a settled one. */
export const DEVICES_PLACEHOLDER: ReadonlyArray<DevicesPairDevice> = [1, 2].map((index) => ({
    id: `placeholder-${index}`,
    name: "xxxxxxxxxx",
    detail: "xxxxxxxx",
    isOnline: false,
    isRevoking: false,
}))

/** Props of the intro card. */
type DevicesPairIntroProps = { readonly labels: DevicesPairLabels }

/** Props of the rules card. */
type DevicesPairRulesProps = { readonly title: string; readonly rules: ReadonlyArray<DevicesPairRule> }

/** The intro card: what working on the learner's own machine means. */
const IntroCard = (props: DevicesPairIntroProps) => (
    <SurfaceCard>
        <Stack gap="row">
            <Text size="sm" tone="muted">
                {props.labels.eyebrow}
            </Text>
            <Heading level={1}>{props.labels.title}</Heading>
            <Text>{props.labels.intro}</Text>
        </Stack>
    </SurfaceCard>
)

/** The pairing card: the install and login steps, the code entry with its preview and the confirm. */
const PairCard = (props: DevicesPairBaseProps) => {
    const view = props.props
    return (
        <SurfaceCard>
            <Stack gap="row">
                {view.steps.map((step, index) => (
                    <Stack key={step.title} gap="identity">
                        <Text isStrong>{`${index + 1}. ${step.title}`}</Text>
                        {step.command === undefined ? null : <FencedCodeBlock code={step.command} language="bash" />}
                        <Text size="sm" tone="muted">
                            {step.note}
                        </Text>
                    </Stack>
                ))}
                <Input
                    id="relay-pair-code"
                    name="userCode"
                    label={view.labels.codeLabel}
                    description={view.labels.codeHint}
                    placeholder={view.labels.codePlaceholder}
                    value={view.code}
                    onValueChange={props.on.changeCode}
                />
                {view.isCodeUnknown ? <Alert tone="negative" title={view.labels.codeUnknown} /> : null}
                {view.preview === undefined ? null : (
                    <Alert
                        tone="informative"
                        title={`${view.labels.previewTitle}: ${view.preview.name} · ${view.preview.detail}`}
                    />
                )}
                <Cluster gap="inline" wrap align="center">
                    <Button
                        intent="commit"
                        onPress={props.on.confirm}
                        isDisabled={!view.canConfirm}
                        isPending={view.isConfirming}
                    >
                        {view.isConfirming ? view.labels.confirming : view.labels.confirm}
                    </Button>
                </Cluster>
                {view.notice === "" ? null : (
                    <Alert tone={view.isNoticeError ? "negative" : "affirmative"} title={view.notice} />
                )}
            </Stack>
        </SurfaceCard>
    )
}

/** The device list card with online state and revoke. */
const DevicesCard = (props: DevicesPairBaseProps) => {
    const view = props.props
    return (
        <SurfaceCard label={view.labels.devicesTitle}>
            <SlotView
                slot={view.devices}
                placeholder={view.placeholder}
                labels={view.slotLabels}
                onRetry={props.on.retry}
                render={(devices) => (
                    <Stack gap="row">
                        {devices.map((device) => (
                            <Cluster key={device.id} gap="row" wrap align="center">
                                <Stack gap="identity">
                                    <Text isStrong>{device.name}</Text>
                                    <Text size="sm" tone="muted">
                                        {device.detail}
                                    </Text>
                                </Stack>
                                <Cluster gap="inline" wrap align="center">
                                    <Badge tone={device.isOnline ? "success" : "neutral"}>
                                        {device.isOnline ? view.labels.online : view.labels.offline}
                                    </Badge>
                                    <Button
                                        intent="neutral"
                                        size="sm"
                                        onPress={() => props.on.revoke(device.id)}
                                        isPending={device.isRevoking}
                                    >
                                        {view.labels.revoke}
                                    </Button>
                                </Cluster>
                            </Cluster>
                        ))}
                    </Stack>
                )}
            />
            <Text size="sm" tone="muted">
                {view.labels.devicesLimit}
            </Text>
        </SurfaceCard>
    )
}

/** The rules card: what the CLI may and may not do. */
const RulesCard = (props: DevicesPairRulesProps) => (
    <SurfaceCard label={props.title}>
        <Stack gap="identity">
            {props.rules.map((rule) => (
                <Text key={rule.text}>{`${rule.isAllowed ? "✓" : "✕"} ${rule.text}`}</Text>
            ))}
        </Stack>
    </SurfaceCard>
)

/** The pairing screen: what the CLI is, the install and login steps, the code entry with its preview, the devices and the rules. */
export const DevicesPairBase = (props: DevicesPairBaseProps) => (
    <Page>
        <Stack gap="section">
            <IntroCard labels={props.props.labels} />
            <PairCard {...props} />
            <DevicesCard {...props} />
            <RulesCard title={props.props.labels.rulesTitle} rules={props.props.rules} />
        </Stack>
    </Page>
)
