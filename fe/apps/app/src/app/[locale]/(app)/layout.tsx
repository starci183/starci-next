import type { ReactNode, ReactElement } from "react"
import { AppLayout } from "@/features/layouts/AppLayout"

type LayoutProps = { readonly children: ReactNode }

/** The product pages' layout slot: the app chrome (header with navigation, plan and account) around the routed body. */
const Layout = (props: LayoutProps): ReactElement => <AppLayout content={props.children} />

export default Layout
