import type { ReactNode } from "react"
import { WIDE_ONLY_CLASS_NAME } from "./classNames"

/** What the wide-only group wraps: the bar controls that a compact bar leaves to its drawer. */
type BarWideProps = { readonly children: ReactNode }

/** A group of bar controls shown from 70rem up (the wide rail); below it they are not drawn (the menu drawer carries them). */
export const BarWide = (props: BarWideProps) => <div className={WIDE_ONLY_CLASS_NAME}>{props.children}</div>
