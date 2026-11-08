import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { InterviewReport } from "@/components/blocks/InterviewReport"
import type { ReactElement } from "react"

/** The document title of the interview report, from the catalog of the requested locale. */
export const interviewReportMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.interview")
    return { title: t("reportTitle") }
}

type PageProps = { readonly sessionId: string }

/** The interview report page: it hands the session in the address to the block that reads and draws the scorecard. */
export const InterviewReportPage = (props: PageProps): ReactElement => <InterviewReport sessionId={props.sessionId} />
