"use client"

import { Page } from "@starci/grammar/common"
import { ProjectsPitch } from "@/components/blocks/ProjectsPitch"
import { useProjectsAccess } from "@/hooks/projects"
import type { ReactElement, ReactNode } from "react"

/** Framework-layout boundary input: the routed Projects page body and nothing else. */
type ProjectsLayoutProps = { readonly content: ReactNode }

/**
 * The gate of every Projects screen. Projects are subscription only: a Premium subscriber gets the routed screen, anyone else gets the
 * pitch with the subscribe action, never a reduced tool. The back end refuses the same doors; this layout only words them.
 */
export const ProjectsLayout = (props: ProjectsLayoutProps): ReactElement => {
    const access = useProjectsAccess()
    if (access === "open") return <>{props.content}</>
    if (access === "locked") return <ProjectsPitch />
    return <Page isLoading>{null}</Page>
}
