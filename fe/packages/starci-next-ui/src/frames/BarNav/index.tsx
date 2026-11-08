import type { ReactNode } from "react"
import { NAV_INLINE_CLASS_NAME } from "./classNames"

/** What the bar's navigation scroller wraps: the navigation landmark. */
type BarNavProps = { readonly children: ReactNode }

/** The bar's inline navigation, drawn only where it fits on one line (from 90rem); labels never wrap, and the drawer carries the navigation below. */
export const BarNav = (props: BarNavProps) => <div className={NAV_INLINE_CLASS_NAME}>{props.children}</div>
