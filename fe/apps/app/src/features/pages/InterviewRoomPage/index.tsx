import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { InterviewRoom } from "@/components/blocks/InterviewRoom"
import type { ReactElement } from "react"

/** The document title of the interview room, from the catalog of the requested locale. */
export const interviewRoomMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.interview")
    return { title: t("roomTitle") }
}

type PageProps = { readonly sessionId: string }

/** The interview room page: it hands the session in the address to the block that reads and draws the conversation. */
export const InterviewRoomPage = (props: PageProps): ReactElement => <InterviewRoom sessionId={props.sessionId} />
