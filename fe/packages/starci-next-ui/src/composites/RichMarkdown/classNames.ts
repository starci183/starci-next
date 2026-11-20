import { cn } from "@heroui/react"

/** Emphasis in a body is the 500 weight, never italic (rule 4); the important marks win over the Grammar article's own `em` style. */
export const BODY_EMPHASIS_CLASS_NAME: string | undefined = cn("[&_em]:not-italic!", "[&_em]:font-medium!")
