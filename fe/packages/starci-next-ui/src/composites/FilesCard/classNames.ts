import { cn } from "@heroui/react"

/** Code that wraps at the width of its frame instead of scrolling sideways: a long line is never cut. */
export const WRAPPED_CODE_CLASS_NAME: string | undefined = cn("whitespace-pre-wrap", "break-words")
