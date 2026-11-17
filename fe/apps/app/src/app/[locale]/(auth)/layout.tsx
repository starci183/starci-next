import type { ReactNode, ReactElement } from "react"
import { AuthLayout } from "@/features/layouts/AuthLayout"

type LayoutProps = { readonly children: ReactNode }

/** The sign-in pages' layout slot: the auth frame, with no app header band. */
const Layout = (props: LayoutProps): ReactElement => <AuthLayout content={props.children} />

export default Layout
