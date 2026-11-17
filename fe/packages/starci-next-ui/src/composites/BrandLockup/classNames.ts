import { cn } from "@heroui/react"

/** The box of the header logo: it gives the image its size, so the logo never depends on the width of its parent. */
export const HEADER_LOGO_CLASS_NAME: string | undefined = cn("size-8", "shrink-0")

/** The box of the logo above an auth card (44px, inline with the wordmark). */
export const ENTRY_LOGO_CLASS_NAME: string | undefined = cn("size-11", "shrink-0")
