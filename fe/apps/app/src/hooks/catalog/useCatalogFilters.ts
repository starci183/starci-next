"use client"

import { useState } from "react"
import type { CatalogFilters } from "@/modules/types"
import { NO_FILTERS } from "./catalog.shared"

/** What useCatalogFilters answers: what the reader chose and the commands that change it. */
type CatalogFiltersHook = {
    readonly filters: CatalogFilters
    readonly choose: (change: Partial<CatalogFilters>) => void
    readonly clear: () => void
}

/** Keeps the reader's choices in the aside and the toolbar of the catalog; the filtering itself is client-side. */
export const useCatalogFilters = (): CatalogFiltersHook => {
    const [filters, setFilters] = useState<CatalogFilters>(NO_FILTERS)
    return {
        filters,
        choose: (change) => setFilters((current) => ({ ...current, ...change })),
        clear: () => setFilters(NO_FILTERS),
    }
}
