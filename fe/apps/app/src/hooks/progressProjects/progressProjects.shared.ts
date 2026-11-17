import type { LearnerProgress } from "@/hooks/swr"
import { APP_ROUTES } from "@/modules/routes"
import type { ProgressBlockView } from "@/modules/types"
import type { ProgressTranslate } from "@/hooks/progressWords"

/** The Projects part when the plan has no subscription: one row that invites, never a crippled tool. */
const pitchOf = (t: ProgressTranslate): ProgressBlockView => ({
    lists: [
        {
            id: "projects-pitch",
            title: t("projects.title"),
            rows: [
                {
                    id: "pitch",
                    title: t("projects.pitchTitle"),
                    description: t("projects.pitchBody"),
                    action: { label: t("projects.pitchCta"), href: APP_ROUTES.premium, endArrow: true },
                },
            ],
            empty: t("projects.empty"),
        },
    ],
})

/** The Projects part: the figures and the projects of a subscriber, or the pitch for anyone else. */
export const projectsOf = (t: ProgressTranslate, data: LearnerProgress): ProgressBlockView | null => {
    if (data.projectsLocked) return pitchOf(t)
    const projects = data.projects
    if (projects === null) return null
    return {
        figures: {
            title: t("projects.title"),
            link: { label: t("projects.open"), href: APP_ROUTES.projects },
            items: [
                {
                    id: "proved",
                    term: t("projects.proved"),
                    value: projects.conceptsProved,
                    unit: `/${projects.conceptsTotal}`,
                },
                { id: "practising", term: t("projects.practising"), value: projects.conceptsPractising },
                {
                    id: "milestones",
                    term: t("projects.milestones"),
                    value: projects.milestonesDone,
                    unit: `/${projects.milestonesTotal}`,
                },
            ],
        },
        lists: [
            {
                id: "projects",
                title: t("projects.title"),
                rows: projects.projects.map((project) => ({
                    id: project.projectId,
                    title: project.name,
                    description: t("projects.project", {
                        proved: project.proved,
                        total: project.total,
                        done: project.milestonesDone,
                        milestones: project.milestonesTotal,
                    }),
                    action: {
                        label: t("projects.open"),
                        href: `${APP_ROUTES.projects}/${encodeURIComponent(project.projectId)}`,
                    },
                })),
                empty: t("projects.empty"),
            },
        ],
    }
}
