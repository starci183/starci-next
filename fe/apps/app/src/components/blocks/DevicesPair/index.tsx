"use client"

import { useFormatter, useTranslations } from "next-intl"
import { useState } from "react"
import { useSession } from "@/hooks/auth"
import { useDevicePairing, type DevicePairing } from "@/hooks/devices"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useDocumentTitle } from "@/hooks/title"
import type { DataSlot, DevicesPairDevice, DevicesPairLabels } from "@/modules/types"
import { DEVICES_PLACEHOLDER, DevicesPairBase } from "./component"

type Translate = ReturnType<typeof useTranslations>
type Formatter = ReturnType<typeof useFormatter>

/** The platform of a device in the reader's words. */
const platformWords = (t: Translate, platform: string): string =>
    t(`platform.${platform === "windows" || platform === "macos" ? platform : "linux"}`)

/** The words of the outcome of the last confirm or revoke. */
const noticeOf = (t: Translate, pairing: DevicePairing): string => {
    if (pairing.issue === "codeNotFound") return t("error.codeNotFound")
    if (pairing.issue === "deviceLimit") return t("error.deviceLimit")
    if (pairing.issue === "other") return t("error.other")
    return pairing.confirmedName === undefined ? "" : t("confirmed", { name: pairing.confirmedName })
}

/** The devices of the list, in words. */
const devicesOf = (t: Translate, format: Formatter, pairing: DevicePairing): ReadonlyArray<DevicesPairDevice> =>
    (pairing.devices ?? []).map((device) => ({
        id: device.id,
        name: device.name,
        detail:
            device.lastSeenAt === null
                ? platformWords(t, device.platform)
                : t("lastSeen", {
                      platform: platformWords(t, device.platform),
                      when: format.relativeTime(new Date(device.lastSeenAt)),
                  }),
        isOnline: device.online,
        isRevoking: pairing.revokingId === device.id,
    }))

/** The fixed words of the devices screen, from the catalogue. */
const labelsOf = (t: Translate): DevicesPairLabels => ({
    codeLabel: t("codeLabel"),
    codePlaceholder: t("codePlaceholder"),
    codeHint: t("codeHint"),
    codeUnknown: t("error.codeNotFound"),
    previewTitle: t("previewTitle"),
    confirm: t("confirm"),
    confirming: t("confirming"),
    devicesLimit: t("devicesLimit"),
    online: t("online"),
    offline: t("offline"),
    revoke: t("revoke"),
    rulesTitle: t("rulesTitle"),
    pageHeading: t("pageHeading"),
    pageSub: t("pageSub"),
    connect: t("connect"),
    connectTitle: t("connectTitle"),
    pairedTitle: t("pairedTitle"),
    emptyTitle: t("emptyTitle"),
    emptyText: t("emptyText"),
    levelsTitle: t("levelsTitle"),
    practiceTitle: t("practiceTitle"),
    practiceText: t("practiceText"),
    proofTitle: t("proofTitle"),
    proofText: t("proofText"),
    closeLabel: t("closeLabel"),
    allowed: t("allowed"),
    denied: t("denied"),
})

/** The connected devices screen: pair the learner's machine with a code from the CLI and manage the paired devices. */
export const DevicesPair = () => {
    const t = useTranslations("app.devices")
    const format = useFormatter()
    const session = useSession()
    const pairing = useDevicePairing(session.status === "signed-in")
    const [isConnectOpen, setIsConnectOpen] = useState(false)
    useDocumentTitle(t("pageTitle"))
    const devicesRead = { data: pairing.devices, error: pairing.devicesError, isLoading: pairing.isDevicesLoading }
    return (
        <DevicesPairBase
            props={{
                labels: labelsOf(t),
                slotLabels: useSlotLabels()(t("devicesEmpty")),
                steps: [
                    { title: t("step.install"), command: "npm install -g @starci/next", note: t("step.installNote") },
                    { title: t("step.login"), command: "starci-next login", note: t("step.loginNote") },
                    { title: t("step.confirm"), command: undefined, note: t("step.confirmNote") },
                ],
                rules: [
                    { text: t("rule.manifest"), isAllowed: true },
                    { text: t("rule.ask"), isAllowed: true },
                    { text: t("rule.results"), isAllowed: true },
                    { text: t("rule.noSecrets"), isAllowed: false },
                    { text: t("rule.noShell"), isAllowed: false },
                ],
                code: pairing.code,
                preview:
                    pairing.preview === undefined
                        ? undefined
                        : { name: pairing.preview.name, detail: platformWords(t, pairing.preview.platform) },
                isCodeUnknown: pairing.isCodeUnknown,
                canConfirm: pairing.preview !== undefined && !pairing.isConfirming,
                isConfirming: pairing.isConfirming,
                notice: noticeOf(t, pairing),
                isNoticeError: pairing.issue !== "none",
                devices: listSlotOf(mapSlot(slotOfSwr(devicesRead), () => devicesOf(t, format, pairing))),
                placeholder: DEVICES_PLACEHOLDER,
                isConnectOpen,
            }}
            on={{
                changeCode: pairing.setCode,
                confirm: pairing.confirm,
                revoke: pairing.revoke,
                retry: pairing.retryDevices,
                setConnectOpen: setIsConnectOpen,
            }}
        />
    )
}

/** The device list slot where an empty list is a settled list of no rows: the card draws its own empty state with the pairing steps. */
const listSlotOf = (slot: DataSlot<ReadonlyArray<DevicesPairDevice>>): DataSlot<ReadonlyArray<DevicesPairDevice>> =>
    "isEmpty" in slot ? { items: [] } : slot
