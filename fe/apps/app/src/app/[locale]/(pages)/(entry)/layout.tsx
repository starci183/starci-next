import { EntryLayout } from "@/features/layouts/EntryLayout"
import type { ReactNode, ReactElement } from "react"

type LayoutProps = { readonly children: ReactNode }

/** The entry pages' layout slot (sign in, confirm the address, set a new password): the entry frame, with no app header band. */
const Layout = (props: LayoutProps): ReactElement => <EntryLayout content={props.children} />

export default Layout
