import {
    Alert,
    Button,
    CopyField,
    DescriptionList,
    Dialog,
    EmptyNotice,
    Input,
    Page,
    Pane,
    PaneGrid,
    PaneSection,
    Section,
    Stack,
    Text,
    type ListRowData,
    type PageHeaderContent,
} from "@starci/grammar/common"
import { SlotView, StepRows } from "@starci-next/ui"
import type { DeviceRow, DevicesPairBaseProps, TokenRow } from "@/modules/types"

/** The fake device list with the geometry of a settled one. */
export const DEVICES_PLACEHOLDER: ReadonlyArray<DeviceRow> = [1, 2].map((index) => ({
    id: `placeholder-${index}`,
    name: " ".repeat(14),
    detail: " ".repeat(30),
    isOnline: false,
    isRevoking: false,
}))

/** The fake token list with the geometry of a settled one. */
export const TOKENS_PLACEHOLDER: ReadonlyArray<TokenRow> = [1, 2].map((index) => ({
    id: `placeholder-${index}`,
    name: " ".repeat(14),
    detail: " ".repeat(30),
    isRevoking: false,
}))

/** The row of one paired machine: name, platform and last seen, the online state and the revoke command. */
const deviceRowOf = (device: DeviceRow, props: DevicesPairBaseProps): ListRowData => ({
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

/** The three steps that connect a new machine, then the paired machines with the places left. */
const DevicesBody = (
    props: DevicesPairBaseProps & { readonly devices: ReadonlyArray<DeviceRow>; readonly isLoading: boolean },
) => {
    const { labels } = props.props
    return (
        <Stack gap="section">
            <Section title={labels.connectNewTitle} headingLevel={2} isLoading={props.isLoading}>
                <StepRows steps={props.props.steps} isLoading={props.isLoading} />
            </Section>
            {props.devices.length === 0 ? (
                <Section title={labels.pairedTitle} headingLevel={2} count={0} isLoading={props.isLoading}>
                    <EmptyNotice mark="none" message={labels.emptyTitle} description={labels.emptyText} />
                </Section>
            ) : (
                <Section
                    kind="list"
                    title={labels.pairedTitle}
                    headingLevel={2}
                    count={props.devices.length}
                    isLoading={props.isLoading}
                    items={props.devices.map((device) => deviceRowOf(device, props))}
                    empty={null}
                    caption={props.props.caption(props.devices.length)}
                />
            )}
        </Stack>
    )
}

/** The commands for Claude Code and Codex, then the tokens with their create command. */
const McpBody = (props: DevicesPairBaseProps) => {
    const { labels, mcp } = props.props
    return (
        <Stack gap="section">
            <Section title={labels.mcpAskTitle} headingLevel={2}>
                <Stack gap="row">
                    <Text tone="muted">{labels.mcpAskText}</Text>
                    {mcp.commands.map((command) => (
                        <CopyField
                            key={command.id}
                            label={command.label}
                            value={command.command}
                            copyLabel={labels.copy}
                            copiedLabel={labels.copied}
                            copyErrorLabel={labels.copyFailed}
                        />
                    ))}
                </Stack>
            </Section>
            <SlotView
                slot={mcp.tokens}
                placeholder={mcp.placeholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retryTokens}
                render={(tokens, isLoading) => (
                    <Stack gap="row">
                        {mcp.createdSecret === undefined ? null : (
                            <Alert
                                tone="cautionary"
                                title={labels.mcpCreatedTitle}
                                description={labels.mcpCreatedHint}
                                action={{ label: labels.mcpDismiss, onAction: props.on.dismissCreated }}
                                form={
                                    <CopyField
                                        label={labels.mcpCreatedTitle}
                                        isLabelHidden
                                        value={mcp.createdSecret}
                                        copyLabel={labels.copy}
                                        copiedLabel={labels.copied}
                                        copyErrorLabel={labels.copyFailed}
                                    />
                                }
                            />
                        )}
                        {tokens.length === 0 ? (
                            <Section title={labels.mcpTokensTitle} headingLevel={2} count={0} isLoading={isLoading}>
                                <EmptyNotice mark="none" message={labels.mcpTokensEmpty} />
                            </Section>
                        ) : (
                            <Section
                                kind="list"
                                title={labels.mcpTokensTitle}
                                headingLevel={2}
                                count={tokens.length}
                                isLoading={isLoading}
                                empty={null}
                                caption={mcp.caption}
                                items={tokens.map((token): ListRowData => ({
                                    id: token.id,
                                    title: token.name,
                                    description: token.detail,
                                    action: {
                                        label: labels.revoke,
                                        press: () => props.on.revokeToken(token.id),
                                        isPending: token.isRevoking,
                                    },
                                }))}
                            />
                        )}
                        {mcp.notice === "" ? null : <Alert tone="negative" title={mcp.notice} />}
                        <div>
                            <Button variant="border" onPress={() => props.on.openCreate(true)}>
                                {labels.mcpCreate}
                            </Button>
                        </div>
                    </Stack>
                )}
            />
        </Stack>
    )
}

/** The aside: what the CLI may and may not do, each with its answer. */
const Aside = (props: DevicesPairBaseProps) => (
    <Section
        title={props.props.labels.rulesTitle}
        kind="list"
        empty={null}
        items={props.props.rules.map((rule): ListRowData => ({
            id: rule.id,
            title: rule.text,
            ...(rule.note === undefined ? {} : { description: rule.note }),
            badges: [
                rule.isAllowed
                    ? { label: props.props.labels.allowed, tone: "success" as const }
                    : { label: props.props.labels.denied, tone: "danger" as const },
            ],
        }))}
    />
)

/** The connect dialog: the code from the terminal, then the machine it names and the confirm. */
const ConnectDialog = (props: DevicesPairBaseProps) => {
    const { labels, dialog } = props.props
    return (
        <Dialog
            isOpen={dialog.isOpen}
            onOpenChange={props.on.openConnect}
            title={labels.dialogTitle}
            closeLabel={labels.closeLabel}
            size="sm"
        >
            <Stack gap="row">
                <Input
                    id="relay-pair-code"
                    name="userCode"
                    label={labels.codeLabel}
                    placeholder={labels.codePlaceholder}
                    value={dialog.code}
                    onValueChange={props.on.changeCode}
                    isInvalid={dialog.isCodeUnknown}
                    errorMessage={dialog.isCodeUnknown ? labels.codeUnknown : undefined}
                />
                {dialog.preview === undefined ? null : (
                    <Stack gap="row">
                        <DescriptionList
                            isDivided
                            items={[
                                { id: "name", term: labels.previewName, description: dialog.preview.name },
                                { id: "system", term: labels.previewSystem, description: dialog.preview.system },
                                { id: "expires", term: labels.previewExpires, description: dialog.preview.expires },
                            ]}
                        />
                        <Text tone="muted">{labels.previewHint}</Text>
                    </Stack>
                )}
                {dialog.notice === "" ? null : (
                    <Alert
                        tone="cautionary"
                        title={dialog.isLimit ? labels.limitTitle : dialog.notice}
                        {...(dialog.isLimit ? { description: labels.limitText } : {})}
                    />
                )}
                {dialog.isLimit ? (
                    <Button variant="primary" width="fill" href={props.props.plansHref}>
                        {labels.plansLabel}
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        width="fill"
                        onPress={props.on.confirm}
                        isDisabled={!dialog.canConfirm}
                        isPending={dialog.isConfirming}
                    >
                        {dialog.isConfirming ? labels.confirming : labels.confirm}
                    </Button>
                )}
                <Button variant="border" width="fill" onPress={() => props.on.openConnect(false)}>
                    {labels.cancel}
                </Button>
            </Stack>
        </Dialog>
    )
}

/** The dialog that names a new MCP token. */
const CreateDialog = (props: DevicesPairBaseProps) => {
    const { labels, mcp } = props.props
    return (
        <Dialog
            isOpen={mcp.isCreateOpen}
            onOpenChange={props.on.openCreate}
            title={labels.mcpCreateTitle}
            closeLabel={labels.closeLabel}
            size="sm"
        >
            <Stack gap="row">
                <Input
                    id="mcp-token-name"
                    name="name"
                    label={labels.mcpNameLabel}
                    description={labels.mcpCreateHint}
                    placeholder={labels.mcpNamePlaceholder}
                    value={mcp.name}
                    onValueChange={props.on.changeName}
                />
                <Button
                    variant="primary"
                    width="fill"
                    onPress={props.on.createToken}
                    isDisabled={mcp.name.trim() === ""}
                    isPending={mcp.isCreating}
                >
                    {mcp.isCreating ? labels.mcpCreating : labels.mcpCreate}
                </Button>
                <Button variant="border" width="fill" onPress={() => props.on.openCreate(false)}>
                    {labels.cancel}
                </Button>
            </Stack>
        </Dialog>
    )
}

/** The band: the title, the machines used and the two views as page tabs; the connect command stands in the band on the machines view. */
const bandOf = (
    devices: ReadonlyArray<DeviceRow> | undefined,
    isLoading: boolean,
    props: DevicesPairBaseProps,
): PageHeaderContent => {
    const { labels, tab, mcpCount } = props.props
    return {
        breadcrumbs: "root",
        title: labels.pageTitle,
        meta: props.props.meta(devices?.length),
        ...(tab === "devices"
            ? {
                  actions: (
                      <Button variant="primary" startGlyph="plus" onPress={() => props.on.openConnect(true)}>
                          {labels.connect}
                      </Button>
                  ),
              }
            : {}),
        tabs: {
            label: labels.tabsLabel,
            kind: "views",
            labelVisibility: "always",
            selectedKey: tab,
            onSelect: (key) => props.on.selectTab(key === "mcp" ? "mcp" : "devices"),
            items: [
                {
                    id: "devices",
                    label: labels.devicesTab,
                    ...(isLoading || devices === undefined ? {} : { count: devices.length }),
                },
                { id: "mcp", label: labels.mcpTab, ...(mcpCount === undefined ? {} : { count: mcpCount }) },
            ],
        },
    }
}

/**
 * The machines screen: the band with the connect command and two page tabs. The machines tab holds the three steps and the paired
 * machines; the MCP tab holds the commands for Claude Code and Codex and the tokens. The aside says what the CLI may do. Connecting
 * a machine and naming a token are dialogs.
 */
export const DevicesPairBase = (props: DevicesPairBaseProps) => {
    const view = props.props
    return (
        <SlotView<ReadonlyArray<DeviceRow>, PageHeaderContent>
            slot={view.devices}
            placeholder={view.placeholder}
            labels={view.slotLabels}
            onRetry={props.on.retry}
            errorDescription={view.errorText}
            header={(devices, isLoading) => bandOf(devices, isLoading, props)}
            headerFallback={bandOf(undefined, false, props)}
            render={(devices, isLoading) =>
                view.tab === "devices" ? (
                    <DevicesBody {...props} devices={devices} isLoading={isLoading} />
                ) : (
                    <McpBody {...props} />
                )
            }
            frame={({ header, body, isLoading }) => (
                <Page chrome="panes" layout="workspace" isLoading={isLoading} header={header}>
                    <PaneGrid
                        label={view.labels.pageTitle}
                        areas={{ base: ["main", "aside"], wide: ["main aside"] }}
                        columns={{ base: ["fill"], wide: ["fill", "standard"] }}
                    >
                        <Pane area="main" scroll label={view.labels.pageTitle}>
                            <PaneSection>
                                {body}
                                <ConnectDialog {...props} />
                                <CreateDialog {...props} />
                            </PaneSection>
                        </Pane>
                        <Pane area="aside" surface scroll label={view.labels.rulesTitle}>
                            <PaneSection>
                                <Aside {...props} />
                            </PaneSection>
                        </Pane>
                    </PaneGrid>
                </Page>
            )}
        />
    )
}
