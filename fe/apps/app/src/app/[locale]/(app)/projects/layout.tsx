import type { ReactNode, ReactElement } from "react"
import { ProjectsLayout } from "@/features/layouts/ProjectsLayout"

type LayoutProps = { readonly children: ReactNode }

/** The Projects section's layout slot: the subscription gate around every Projects screen. */
const Layout = (props: LayoutProps): ReactElement => <ProjectsLayout content={props.children} />

export default Layout
