import {
    Button,
    Divider,
    Page,
    Pane,
    PaneGrid,
    PaneSection,
    Section,
    Stack,
    SurfaceCard,
    Text,
    type ListRowData,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import { ConnectDrawer } from "./connect"
import { StepRows } from "./steps"
import type {
    DevicesPairDevice,
    DevicesPairLabels,
    DevicesPairRule,
    DevicesPairStep,
    DevicesPairPreview,
} from "./types"
import type { DataSlot, SlotLabels } from "@/modules/types"

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
        /** True while the connect drawer is open. */
        readonly isConnectOpen: boolean
    }
    readonly on: {
        readonly changeCode: (value: string) => void
        readonly confirm: () => void
        readonly revoke: (id: string) => void
        readonly retry: () => void
        readonly setConnectOpen: (isOpen: boolean) => void
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

/** The empty list: why there is no machine, the pairing steps and the one primary. */
const EmptyDevices = (props: DevicesPairBaseProps) => (
    <Stack gap="row">
        <Stack gap="identity">
            <Text isStrong>{props.props.labels.emptyTitle}</Text>
            <Text size="sm" tone="muted">
                {props.props.labels.emptyText}
            </Text>
        </Stack>
        <StepRows steps={props.props.steps} />
        <Button intent="commit" startGlyph="plus" onPress={() => props.on.setConnectOpen(true)}>
            {props.props.labels.connect}
        </Button>
    </Stack>
)

/** The row of one paired machine: name, platform and last seen, the online chip and the revoke command. */
const deviceRowOf = (device: DevicesPairDevice, props: DevicesPairBaseProps): ListRowData => ({
    id: device.id,
    title: device.name,
    description: device.detail,
    badges: [
        {
            label: device.isOnline ? props.props.labels.online : props.props.labels.offline,
            tone: device.isOnline ? "success" : "muted",
            isDot: true,
        },
    ],
    action: { label: props.props.labels.revoke, press: () => props.on.revoke(device.id), isPending: device.isRevoking },
})

/** The paired machines as one list card; the empty state lives inside it. */
const DevicesCard = (props: DevicesPairBaseProps) => {
    const view = props.props
    return (
        <SlotView
            slot={view.devices}
            placeholder={view.placeholder}
            labels={view.slotLabels}
            onRetry={props.on.retry}
            render={(devices, isLoading) =>
                devices.length === 0 ? (
                    <SurfaceCard label={view.labels.pairedTitle} count={0} isLoading={isLoading}>
                        <EmptyDevices {...props} />
                    </SurfaceCard>
                ) : (
                    <SurfaceCard
                        kind="list"
                        label={view.labels.pairedTitle}
                        count={devices.length}
                        isLoading={isLoading}
                        items={devices.map((device) => deviceRowOf(device, props))}
                        empty={null}
                        note={view.labels.devicesLimit}
                    />
                )
            }
        />
    )
}

/** What the aside needs: the words and the rules. */
type AsideProps = { readonly labels: DevicesPairLabels; readonly rules: ReadonlyArray<DevicesPairRule> }

/** The aside: the two proof levels as rows, then what the CLI may and may not do. */
const Aside = (props: AsideProps) => {
    const labels = props.labels
    return (
        <Stack gap="section">
            <Section
                title={labels.levelsTitle}
                kind="list"
                items={[
                    {
                        id: "practice",
                        title: labels.practiceTitle,
                        description: labels.practiceText,
                    },
                    {
                        id: "proof",
                        title: labels.proofTitle,
                        description: labels.proofText,
                    },
                ]}
                empty={null}
            />
            <Divider />
            <Section
                title={labels.rulesTitle}
                kind="list"
                items={props.rules.map((rule, index) => ({
                    id: `rule-${index}`,
                    title: rule.text,
                    badges: [
                        rule.isAllowed
                            ? { label: labels.allowed, tone: "success" as const }
                            : { label: labels.denied, tone: "danger" as const },
                    ],
                }))}
                empty={null}
            />
        </Stack>
    )
}

/** The devices screen: the band with the connect command, the list of paired machines and the aside on proof levels and CLI rules. */
export const DevicesPairBase = (props: DevicesPairBaseProps) => {
    const view = props.props
    const hasDevices = "items" in view.devices && view.devices.items.length > 0
    return (
        <Page
            chrome="panes"
            header={{
                breadcrumbs: "root",
                title: view.labels.pageHeading,
                meta: view.labels.pageSub,
                ...(hasDevices
                    ? {
                          actions: (
                              <Button intent="commit" startGlyph="plus" onPress={() => props.on.setConnectOpen(true)}>
                                  {view.labels.connect}
                              </Button>
                          ),
                      }
                    : {}),
            }}
        >
            <PaneGrid
                label={view.labels.pairedTitle}
                areas={{ base: ["aside", "main"], wide: ["main aside"] }}
                columns={{ base: ["fill"], wide: ["fill", "standard"] }}
            >
                <Pane area="main" scroll label={view.labels.pairedTitle}>
                    <PaneSection>
                        <DevicesCard {...props} />
                        <ConnectDrawer
                            labels={view.labels}
                            steps={view.steps}
                            code={view.code}
                            preview={view.preview}
                            isCodeUnknown={view.isCodeUnknown}
                            canConfirm={view.canConfirm}
                            isConfirming={view.isConfirming}
                            notice={view.notice}
                            isNoticeError={view.isNoticeError}
                            isOpen={view.isConnectOpen}
                            on={{
                                changeCode: props.on.changeCode,
                                confirm: props.on.confirm,
                                setOpen: props.on.setConnectOpen,
                            }}
                        />
                    </PaneSection>
                </Pane>
                <Pane area="aside" surface scroll label={view.labels.levelsTitle}>
                    <PaneSection>
                        <Aside labels={view.labels} rules={view.rules} />
                    </PaneSection>
                </Pane>
            </PaneGrid>
        </Page>
    )
}
