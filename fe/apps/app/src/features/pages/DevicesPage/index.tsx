import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { DevicesPair } from "@/components/blocks/DevicesPair"
import type { ReactElement } from "react"

/** The document title of the page, from the catalog of the requested locale. */
export const devicesMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.devices")
    return { title: t("pageTitle") }
}

/** The devices page (ui.relay.devices): a server owner that mounts the pairing and device list block. */
export const DevicesPage = (): ReactElement => <DevicesPair />
