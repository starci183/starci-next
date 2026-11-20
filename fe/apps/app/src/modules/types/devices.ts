import type { DataSlot, DevicesPairStep, SlotLabels } from "@starci-next/ui"

/** The two views of the page: the paired machines, and the MCP access of Claude Code and Codex. */
export const DEVICES_TABS = ["devices", "mcp"] as const
/** One view per member of {@link DEVICES_TABS}. */
export type DevicesTab = (typeof DEVICES_TABS)[number]

/** One paired device, already in words. */
export type DeviceRow = {
    readonly id: string
    readonly name: string
    readonly detail: string
    readonly isOnline: boolean
    readonly isRevoking: boolean
}

/** One MCP token, already in words. */
export type TokenRow = {
    readonly id: string
    readonly name: string
    readonly detail: string
    readonly isRevoking: boolean
}

/** One rule of what the CLI may and may not do. */
export type DevicesRule = {
    readonly id: string
    readonly text: string
    readonly note: string | undefined
    readonly isAllowed: boolean
}

/** One command the learner pastes into a tool, with the tool's name. */
export type McpCommand = { readonly id: string; readonly label: string; readonly command: string }

/** The pending pairing the learner is about to confirm, in words. */
export type DevicePreview = { readonly name: string; readonly system: string; readonly expires: string }

/** The fixed words of the screen. */
export type DevicesLabels = {
    readonly pageTitle: string
    readonly devicesTab: string
    readonly mcpTab: string
    readonly tabsLabel: string
    readonly connect: string
    readonly connectNewTitle: string
    readonly pairedTitle: string
    readonly emptyTitle: string
    readonly emptyText: string
    readonly online: string
    readonly offline: string
    readonly revoke: string
    readonly rulesTitle: string
    readonly allowed: string
    readonly denied: string
    readonly closeLabel: string
    readonly dialogTitle: string
    readonly codeLabel: string
    readonly codePlaceholder: string
    readonly codeUnknown: string
    readonly previewName: string
    readonly previewSystem: string
    readonly previewExpires: string
    readonly previewHint: string
    readonly confirm: string
    readonly confirming: string
    readonly cancel: string
    readonly limitTitle: string
    readonly limitText: string
    readonly plansLabel: string
    readonly mcpAskTitle: string
    readonly mcpAskText: string
    readonly mcpTokensTitle: string
    readonly mcpTokensEmpty: string
    readonly mcpCreate: string
    readonly mcpCreateTitle: string
    readonly mcpCreateHint: string
    readonly mcpNameLabel: string
    readonly mcpNamePlaceholder: string
    readonly mcpCreating: string
    readonly mcpCreatedTitle: string
    readonly mcpCreatedHint: string
    readonly mcpDismiss: string
    readonly copy: string
    readonly copied: string
    readonly copyFailed: string
}

/** What the connect dialog holds: the typed code, the machine it names, and the outcome of the last step. */
export type ConnectDialogView = {
    readonly isOpen: boolean
    readonly code: string
    readonly preview: DevicePreview | undefined
    readonly isCodeUnknown: boolean
    readonly canConfirm: boolean
    readonly isConfirming: boolean
    /** The words of a refused confirm, or empty. */
    readonly notice: string
    readonly isLimit: boolean
}

/** What the MCP tab holds. */
export type McpView = {
    readonly commands: ReadonlyArray<McpCommand>
    readonly tokens: DataSlot<ReadonlyArray<TokenRow>>
    readonly placeholder: ReadonlyArray<TokenRow>
    readonly caption: string
    readonly isCreateOpen: boolean
    readonly name: string
    readonly isCreating: boolean
    /** The secret of the token just created, or undefined. */
    readonly createdSecret: string | undefined
    /** The words of a refused step, or empty. */
    readonly notice: string
}

/** Props for {@link DevicesPairBase}. */
export type DevicesPairBaseProps = {
    readonly props: {
        readonly labels: DevicesLabels
        readonly slotLabels: SlotLabels
        readonly tab: DevicesTab
        /** The tab counts: paired machines (from the read) and MCP tokens (undefined until read). */
        readonly mcpCount: number | undefined
        /** The line under the title: the machines used, the plan and what the CLI does. */
        readonly meta: (deviceCount: number) => string
        /** The words under the machine list: how many places are left, and what Premium adds. */
        readonly caption: (deviceCount: number) => string
        readonly steps: ReadonlyArray<DevicesPairStep>
        readonly rules: ReadonlyArray<DevicesRule>
        readonly devices: DataSlot<ReadonlyArray<DeviceRow>>
        readonly placeholder: ReadonlyArray<DeviceRow>
        readonly dialog: ConnectDialogView
        readonly plansHref: string
        readonly mcp: McpView
    }
    readonly on: {
        readonly selectTab: (tab: DevicesTab) => void
        readonly openConnect: (isOpen: boolean) => void
        readonly changeCode: (value: string) => void
        readonly confirm: () => void
        readonly revoke: (id: string) => void
        readonly retry: () => void
        readonly openCreate: (isOpen: boolean) => void
        readonly changeName: (value: string) => void
        readonly createToken: () => void
        readonly revokeToken: (id: string) => void
        readonly dismissCreated: () => void
        readonly retryTokens: () => void
    }
}
