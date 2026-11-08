import { cn } from "@heroui/react"

/** The inline navigation is drawn from 90rem up, where every label fits on one line beside the brand and the actions; below it the drawer carries it. */
export const NAV_INLINE_CLASS_NAME: string | undefined = cn("hidden", "min-[90rem]:block", "whitespace-nowrap")
