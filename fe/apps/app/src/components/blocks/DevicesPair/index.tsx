"use client"

import { useFormatter, useTranslations } from "next-intl"
import { useState } from "react"
import { useSession } from "@/hooks/auth"
import { useDevicePairing, type DevicePairing } from "@/hooks/devices"
import { useMcpConnect, type McpConnectIssue } from "@/hooks/mcpConnect"
import { mapSlot, settledListSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryMyPremiumSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES } from "@/modules/routes"
import type { DeviceRow, DevicesInstallGuide, DevicesLabels, DevicesRule, DevicesTab, TokenRow } from "@/modules/types"
import { DEVICES_PLACEHOLDER, DevicesPairBase, TOKENS_PLACEHOLDER } from "./component"

/** The moment relative times are counted from (next-intl asks for it explicitly). */
const NOW = (): Date => new Date()

type Translate = ReturnType<typeof useTranslations>
type Formatter = ReturnType<typeof useFormatter>

/** The machines the free plan may pair, and the machines Premium may. */
const FREE_LIMIT = 1
const PREMIUM_LIMIT = 2

/** The platform of a device in the reader's words. */
const platformWords = (t: Translate, platform: string): string =>
    t(`platform.${platform === "windows" || platform === "macos" ? platform : "linux"}`)

/** The words of the outcome of the last confirm or revoke; a limit is worded by the dialog itself. */
const noticeOf = (t: Translate, pairing: DevicePairing): string => {
    if (pairing.issue === "codeNotFound") return t("error.codeNotFound")
    if (pairing.issue === "deviceLimit") return t("error.deviceLimit")
    if (pairing.issue === "other") return t("error.other")
    return ""
}

/** The words of a refused token step. */
const tokenNoticeOf = (t: Translate, issue: McpConnectIssue): string => (issue === "none" ? "" : t(`mcpError.${issue}`))

/** The devices of the list, in words: platform, when it was paired and when it was last seen. */
const devicesOf = (t: Translate, format: Formatter, pairing: DevicePairing): ReadonlyArray<DeviceRow> =>
    (pairing.devices ?? []).map((device) => {
        const platform = platformWords(t, device.platform)
        const paired = format.dateTime(new Date(device.pairedAt), { dateStyle: "short" })
        return {
            id: device.id,
            name: device.name,
            detail:
                device.lastSeenAt === null
                    ? t("pairedAt", { platform, paired })
                    : t("lastSeen", {
                          platform,
                          paired,
                          when: format.relativeTime(new Date(device.lastSeenAt), NOW()),
                      }),
            isOnline: device.online,
            isRevoking: pairing.revokingId === device.id,
        }
    })

/** The fixed words of the screen, from the catalogue. */
const labelsOf = (t: Translate): DevicesLabels => ({
    pageTitle: t("pageHeading"),
    devicesTab: t("devicesTab"),
    mcpTab: t("mcpTab"),
    tabsLabel: t("tabsLabel"),
    connect: t("connect"),
    connectNewTitle: t("connectNewTitle"),
    pairedTitle: t("pairedTitle"),
    emptyTitle: t("emptyTitle"),
    emptyText: t("emptyText"),
    online: t("online"),
    offline: t("offline"),
    revoke: t("revoke"),
    rulesTitle: t("rulesTitle"),
    installTitle: t("install.title"),
    installErrorsTitle: t("install.errorsTitle"),
    allowed: t("allowed"),
    denied: t("denied"),
    closeLabel: t("closeLabel"),
    dialogTitle: t("connectTitle"),
    codeLabel: t("codeLabel"),
    codePlaceholder: t("codePlaceholder"),
    codeUnknown: t("error.codeNotFound"),
    previewName: t("previewName"),
    previewSystem: t("previewSystem"),
    previewExpires: t("previewExpires"),
    previewHint: t("previewHint"),
    confirm: t("confirm"),
    confirming: t("confirming"),
    cancel: t("cancel"),
    limitTitle: t("limitTitle"),
    limitText: t("limitText"),
    plansLabel: t("plansLabel"),
    mcpAskTitle: t("mcpAskTitle"),
    mcpAskText: t("mcpAskText"),
    mcpTokensTitle: t("mcpTokensTitle"),
    mcpTokensEmpty: t("mcpTokensEmpty"),
    mcpCreate: t("mcpCreate"),
    mcpCreateTitle: t("mcpCreateTitle"),
    mcpCreateHint: t("mcpCreateHint"),
    mcpNameLabel: t("mcpNameLabel"),
    mcpNamePlaceholder: t("mcpNamePlaceholder"),
    mcpCreating: t("mcpCreating"),
    mcpCreatedTitle: t("mcpCreatedTitle"),
    mcpCreatedHint: t("mcpCreatedHint"),
    mcpDismiss: t("mcpDismiss"),
    copy: t("copy"),
    copied: t("copied"),
    copyFailed: t("copyFailed"),
})

const INSTALL_STEPS = ["prereq", "install", "login", "service", "update", "remove"] as const
const INSTALL_ERRORS = ["notFound", "node", "permission", "code", "service"] as const

/** The guide "Cài StarCi Relay": each step with its command, then the common errors. */
const installOf = (t: Translate): DevicesInstallGuide => ({
    steps: INSTALL_STEPS.map((key) => ({
        title: t(`install.steps.${key}.title`),
        command: t(`install.steps.${key}.command`),
        note: t(`install.steps.${key}.note`),
    })),
    errors: INSTALL_ERRORS.map((key) => ({
        id: key,
        title: t(`install.errors.${key}.title`),
        note: t(`install.errors.${key}.note`),
    })),
})

/** What the CLI may and may not do, each with its answer and, for a refusal, why. */
const rulesOf = (t: Translate): ReadonlyArray<DevicesRule> =>
    (["run", "send", "relay", "prove", "files"] as const).map((key) => ({
        id: key,
        text: t(`rule.${key}.text`),
        note: t.has(`rule.${key}.note`) ? t(`rule.${key}.note`) : undefined,
        isAllowed: key === "run" || key === "send" || key === "relay",
    }))

/** The machines screen of the learner: pair a machine with a code from the CLI, manage the paired machines, and hold the MCP tokens of Claude Code and Codex. */
export const DevicesPair = () => {
    const t = useTranslations("app.devices")
    const format = useFormatter()
    const session = useSession()
    const isSignedIn = session.status === "signed-in"
    const pairing = useDevicePairing(isSignedIn)
    const connect = useMcpConnect(isSignedIn)
    const mine = useQueryMyPremiumSwr(isSignedIn)
    const [tab, setTab] = useState<DevicesTab>("devices")
    const [isConnectOpen, setIsConnectOpen] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    useDocumentTitle(t("pageTitle"))
    const isPremium = mine.data?.isPremium === true
    const limit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT
    const plan = isPremium ? t("planPremium") : t("planFree")
    const tokenLimit = connect.connection?.mcpConnectInfo.tokenLimit ?? 5
    const tokens = connect.connection?.mcpTokens
    const devicesRead = { data: pairing.devices, error: pairing.devicesError, isLoading: pairing.isDevicesLoading }
    const tokensRead = {
        data: connect.connection,
        error: connect.connectionError,
        isLoading: connect.isConnectionLoading,
    }
    const tokenRows = (): ReadonlyArray<TokenRow> =>
        (tokens ?? []).map((token) => {
            const hint = token.hint
            const created = format.dateTime(new Date(token.createdAt), { dateStyle: "short" })
            return {
                id: token.id,
                name: token.name,
                detail:
                    token.lastUsedAt === null
                        ? t("tokenNeverUsed", { hint, created })
                        : t("tokenUsed", {
                              hint,
                              created,
                              when: format.relativeTime(new Date(token.lastUsedAt), NOW()),
                          }),
                isRevoking: connect.revokingId === token.id,
            }
        })
    return (
        <DevicesPairBase
            props={{
                labels: labelsOf(t),
                slotLabels: { ...useSlotLabels()(t("devicesEmpty")), error: t("devicesError") },
                errorText: t("devicesErrorHint"),
                tab,
                mcpCount: tokens?.length,
                meta: (count) =>
                    tab === "devices"
                        ? count === undefined
                            ? t("pageSub")
                            : t("metaDevices", { count, limit, plan, text: t("pageSub") })
                        : t("metaMcp", { count: tokens?.length ?? 0, limit: tokenLimit, text: t("mcpSub") }),
                caption: (count) => {
                    if (!isPremium) return t("captionFree")
                    return count >= PREMIUM_LIMIT ? t("captionFull") : t("captionLeft", { left: PREMIUM_LIMIT - count })
                },
                steps: [
                    { title: t("step.run"), command: "npm i -g @starci/next-relay", note: t("step.runNote") },
                    { title: t("step.login"), command: "starci-relay login", note: t("step.loginNote") },
                    { title: t("step.confirm"), command: undefined, note: t("step.confirmNote") },
                ],
                install: installOf(t),
                rules: rulesOf(t),
                devices: settledListSlot(mapSlot(slotOfSwr(devicesRead), () => devicesOf(t, format, pairing))),
                placeholder: DEVICES_PLACEHOLDER,
                dialog: {
                    isOpen: isConnectOpen && pairing.confirmedName === undefined,
                    code: pairing.code,
                    preview:
                        pairing.preview === undefined
                            ? undefined
                            : {
                                  name: pairing.preview.name,
                                  system: platformWords(t, pairing.preview.platform),
                                  expires: format.relativeTime(new Date(pairing.preview.expiresAt), NOW()),
                              },
                    isCodeUnknown: pairing.isCodeUnknown,
                    canConfirm: pairing.preview !== undefined && !pairing.isConfirming,
                    isConfirming: pairing.isConfirming,
                    notice: pairing.isCodeUnknown ? "" : noticeOf(t, pairing),
                    isLimit: pairing.issue === "deviceLimit",
                },
                plansHref: APP_ROUTES.premium,
                mcp: {
                    commands: [
                        {
                            id: "claude",
                            label: t("mcpClaudeLabel"),
                            command: t("mcpClaudeCommand", { endpoint: connect.endpoint }),
                        },
                        {
                            id: "codex",
                            label: t("mcpCodexLabel"),
                            command: t("mcpCodexCommand", { endpoint: connect.endpoint }),
                        },
                    ],
                    tokens: settledListSlot(mapSlot(slotOfSwr(tokensRead), tokenRows)),
                    placeholder: TOKENS_PLACEHOLDER,
                    caption: t("mcpTokensCaption", { count: tokens?.length ?? 0, limit: tokenLimit }),
                    isCreateOpen,
                    name: connect.name,
                    isCreating: connect.isCreating,
                    createdSecret: connect.created?.secret,
                    notice: tokenNoticeOf(t, connect.issue),
                },
            }}
            on={{
                selectTab: setTab,
                openConnect: (isOpen) => {
                    if (isOpen) pairing.setCode("")
                    setIsConnectOpen(isOpen)
                },
                changeCode: pairing.setCode,
                confirm: pairing.confirm,
                revoke: pairing.revoke,
                retry: pairing.retryDevices,
                openCreate: setIsCreateOpen,
                changeName: connect.setName,
                createToken: () => {
                    connect.create()
                    setIsCreateOpen(false)
                },
                revokeToken: connect.revoke,
                dismissCreated: connect.dismissCreated,
                retryTokens: connect.retry,
            }}
        />
    )
}
