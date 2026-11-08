import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { AgentTrack } from "@/components/blocks/AgentTrack"
import type { ReactElement } from "react"

/** What the route hands the track page: the segment of the address. */
type AgentTrackPageProps = { readonly trackId: string }

/** The document title of the track page, from the catalog of the requested locale. */
export const agentTrackMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.agents")
    return { title: t("pageTitle") }
}

/** The track page: a server owner that mounts the block that reads the track and draws its labs. */
export const AgentTrackPage = (props: AgentTrackPageProps): ReactElement => <AgentTrack trackId={props.trackId} />
