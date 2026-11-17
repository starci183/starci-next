import { cn } from "@heroui/react"

/** Hidden below the wide rail (70rem, as the NIVO console bar): the controls then live in the navigation drawer; part of the bar's own row from 70rem. */
export const WIDE_ONLY_CLASS_NAME: string | undefined = cn("hidden", "min-[70rem]:contents")
