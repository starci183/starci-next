import type { ReactNode } from "react"
import { BAR_FILL_CLASS_NAME } from "./classNames"

/** What the fill frame wraps: the app bar. */
type BarFillProps = { readonly children: ReactNode }

/** Stretches the app bar across the shell's header row, so its actions stay at the right edge whatever its navigation shows. */
export const BarFill = (props: BarFillProps) => <div className={BAR_FILL_CLASS_NAME}>{props.children}</div>
