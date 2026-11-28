import { cn } from "@heroui/react"

/**
 * The block of a quote whose words carry code names (`checkout.ts`, **order service**): the same box Grammar's `Quote` block draws, read
 * from the same theme hooks (the fill `--starci-core-quote`, the start-edge rule `--starci-core-quote-edge`, the nested inset and the
 * control radius), so it stands beside a plain Grammar `Quote` and reads as the same thing. Grammar's `Quote` takes plain text only.
 */
export const RICH_QUOTE_CLASS_NAME: string | undefined = cn(
    "m-0",
    "flex",
    "min-w-0",
    "flex-col",
    "gap-(--grammar-identity-gap)",
    "p-(--grammar-inset-nested)",
    "rounded-(--starci-core-control-radius)",
    "[border-inline-start:var(--starci-core-quote-edge,0)]",
    "[background:var(--starci-core-quote,var(--surface-secondary))]",
    "text-(color:--foreground)",
    "[overflow-wrap:anywhere]",
)
