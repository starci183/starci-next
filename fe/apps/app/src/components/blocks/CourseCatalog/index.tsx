"use client"

import { useCourseCatalogScreen } from "@/hooks/courseCatalog"
import { CourseCatalogBase } from "./component"

/** The connected Essentials catalog: reads the courses in its hook and hands them to the presentational block. */
export const CourseCatalog = () => {
    const screen = useCourseCatalogScreen()
    return <CourseCatalogBase props={screen.props} on={screen.on} />
}
