"use client"

import { usePracticeCatalogScreen } from "@/hooks/practice"
import { PracticeCatalogBase } from "./component"

/** The connected Practice code screen: reads the patterns and the next problem and hands the resolved screen to the presentational block. */
export const PracticeCatalog = () => {
    const screen = usePracticeCatalogScreen()
    return <PracticeCatalogBase props={screen.props} on={screen.on} />
}
