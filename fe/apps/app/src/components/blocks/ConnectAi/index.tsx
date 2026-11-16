"use client"

import { useFormatter, useTranslations } from "next-intl"
import { useSession } from "@/hooks/auth"
import { useMcpConnect, type McpConnectIssue } from "@/hooks/mcpConnect"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useDocumentTitle } from "@/hooks/title"
import type { DevicesPairStep } from "@/modules/types"
import { CONNECT_AI_PLACEHOLDER, ConnectAiBase, type ConnectAiLabels, type ConnectAiToken } from "./component"

type Translate = ReturnType<typeof useTranslations>

/** The keys of the fixed words, in the catalogue under `app.connectAi`. */
const LABEL_KEYS = [
    "pageHeading",
    "pageSub",
    "endpointTitle",
    "endpointHint",
    "tokensTitle",
    "tokensEmpty",
    "tokensLimit",
    "nameLabel",
    "namePlaceholder",
    "create",
    "creating",
    "revoke",
    "createdTitle",
    "createdHint",
    "dismiss",
    "canTitle",
    "canText",
    "cannotTitle",
    "cannotText",
    "oauthNote",
    "guidesTitle",
] as const

const labelsOf = (t: Translate): ConnectAiLabels =>
    Object.fromEntries(LABEL_KEYS.map((key) => [key, t(key)])) as unknown as ConnectAiLabels

const noticeOf = (t: Translate, issue: McpConnectIssue): string => (issue === "none" ? "" : t(`error.${issue}`))

/** The connect screen of the learner: the MCP address, the access tokens and how to add the connector to Claude and ChatGPT. */
export const ConnectAi = () => {
    const t = useTranslations("app.connectAi")
    const format = useFormatter()
    const session = useSession()
    const connect = useMcpConnect(session.status === "signed-in")
    useDocumentTitle(t("pageTitle"))
    const read = { data: connect.connection, error: connect.connectionError, isLoading: connect.isConnectionLoading }
    const tokensOf = (): ReadonlyArray<ConnectAiToken> =>
        (connect.connection?.mcpTokens ?? []).map((token) => ({
            id: token.id,
            name: token.name,
            detail:
                token.lastUsedAt === null
                    ? t("neverUsed", { hint: token.hint })
                    : t("lastUsed", { hint: token.hint, when: format.relativeTime(new Date(token.lastUsedAt)) }),
            isRevoking: connect.revokingId === token.id,
        }))
    const stepsOf = (guide: "claude" | "chatgpt", keys: ReadonlyArray<string>): ReadonlyArray<DevicesPairStep> =>
        keys.map((key) => ({
            title: t(`${guide}.${key}.title`),
            command: t.has(`${guide}.${key}.command`)
                ? t(`${guide}.${key}.command`, { endpoint: connect.endpoint })
                : undefined,
            note: t(`${guide}.${key}.note`),
        }))
    return (
        <ConnectAiBase
            props={{
                labels: labelsOf(t),
                slotLabels: useSlotLabels()(t("tokensError")),
                endpoint: connect.endpoint,
                guides: [
                    { id: "claude", title: t("claude.title"), steps: stepsOf("claude", ["open", "add", "code"]) },
                    { id: "chatgpt", title: t("chatgpt.title"), steps: stepsOf("chatgpt", ["enable", "add", "use"]) },
                ],
                tokens: mapSlot(slotOfSwr(read), tokensOf),
                placeholder: CONNECT_AI_PLACEHOLDER,
                name: connect.name,
                isCreating: connect.isCreating,
                createdSecret: connect.created?.secret,
                notice: noticeOf(t, connect.issue),
            }}
            on={{
                changeName: connect.setName,
                create: connect.create,
                revoke: connect.revoke,
                dismissCreated: connect.dismissCreated,
                retry: connect.retry,
            }}
        />
    )
}
