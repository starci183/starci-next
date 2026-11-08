import { WorkspaceShell } from "@starci/grammar/common"
import { getTranslations } from "next-intl/server"
import type { ReactNode, ReactElement } from "react"

/** Framework-layout boundary input: the routed page body and nothing else. */
type AuthLayoutProps = { readonly content: ReactNode }

/** The auth frame, resolved on the server: the shell's main landmark around the sign-in page, which draws its own brand and language switch (no app header). */
export const AuthLayout = async (props: AuthLayoutProps): Promise<ReactElement> => {
    const t = await getTranslations("app.shell")
    return <WorkspaceShell viewport="flow" primaryLabel={t("brand")} primary={props.content} />
}
