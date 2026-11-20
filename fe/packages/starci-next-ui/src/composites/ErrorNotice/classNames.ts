import { cn } from "@heroui/react"

/** The page-state notices draw their art on the page's own ground: the file's white backdrop multiplies away instead of showing as a pale square. */
export const NOTICE_ART_CLASS_NAME: string | undefined = cn("[&_img]:mix-blend-multiply")
