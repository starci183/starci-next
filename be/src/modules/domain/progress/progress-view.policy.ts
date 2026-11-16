import { buildEssentials } from "./progress-essentials.policy"
import { buildHarness } from "./progress-harness.policy"
import type {
    LearnerProgressView,
    ProgressActivityView,
    ProgressProjectsView,
    ProgressReviewView,
    ProgressRibbonView,
    ProgressSources,
    ProjectSource,
    ReviewSource,
    StreakSource,
} from "./progress.contracts"

/** The most lines the recent-activity timeline holds. */
export const ACTIVITY_MAX = 12

/** Orders two lines newest first, and by id when they share an instant, so the order is stable. */
const newestFirst = (a: ProgressActivityView, b: ProgressActivityView): number => {
    if (a.at !== b.at) return a.at < b.at ? 1 : -1
    return a.id < b.id ? -1 : 1
}

/** The Projects section from the learner's projects; one proved concept counts once per project. */
export const buildProjects = (projects: ReadonlyArray<ProjectSource>): ProgressProjectsView => ({
    conceptsProved: projects.reduce((sum, project) => sum + project.provedConcepts, 0),
    conceptsPractising: projects.reduce((sum, project) => sum + project.practisingConcepts, 0),
    conceptsTotal: projects.reduce((sum, project) => sum + project.totalConcepts, 0),
    milestonesDone: projects.reduce((sum, project) => sum + project.doneMilestones, 0),
    milestonesTotal: projects.reduce((sum, project) => sum + project.totalMilestones, 0),
    projects: projects.map((project) => ({
        projectId: project.id,
        name: project.name,
        proved: project.provedConcepts,
        practising: project.practisingConcepts,
        total: project.totalConcepts,
        milestonesDone: project.doneMilestones,
        milestonesTotal: project.totalMilestones,
    })),
})

/** The Review section: the day's counts and the streak beside them; null only when both sources failed. */
export const buildReview = (review: ReviewSource | null, streak: StreakSource | null): ProgressReviewView | null =>
    review === null && streak === null
        ? null
        : {
              due: review?.due ?? 0,
              overdue: review?.overdue ?? 0,
              doneToday: review?.doneToday ?? 0,
              goalDaily: review?.goalDaily ?? 0,
              streak: streak?.current ?? 0,
              longestStreak: streak?.longest ?? 0,
              todayCounted: streak?.todayCounted ?? false,
          }

/** The recent-activity timeline: finished lessons, proved concepts, signed items and harness stages, newest first. */
export const buildActivity = (sources: ProgressSources): Array<ProgressActivityView> => {
    const lessons = (sources.lessons ?? []).flatMap((lesson): Array<ProgressActivityView> =>
        lesson.completedAt === null
            ? []
            : [{ id: `lesson:${lesson.id}`, kind: "lesson-done", title: lesson.title, at: lesson.completedAt }],
    )
    const concepts = sources.proved.map((proved): ProgressActivityView => ({
        id: `concept:${proved.projectId}:${proved.conceptId}`,
        kind: "concept-proved",
        title: proved.conceptId,
        at: proved.provedAt,
    }))
    const items = sources.verified.map((item): ProgressActivityView => ({
        id: `item:${item.itemId}`,
        kind: "experience-verified",
        title: item.title,
        at: item.signedAt,
    }))
    const stages = (sources.harness?.events ?? []).map((event): ProgressActivityView => ({
        id: `harness:${event.id}`,
        kind: "harness-stage",
        title: event.title,
        at: event.at,
    }))
    return [...lessons, ...concepts, ...items, ...stages].sort(newestFirst).slice(0, ACTIVITY_MAX)
}

/** The ribbon: proved concepts, the streak, lessons done and builds done. */
export const buildRibbon = (sources: ProgressSources, buildsDone: number): ProgressRibbonView => ({
    provedConcepts: sources.proved.length,
    streak: sources.streak?.current ?? 0,
    lessonsDone: (sources.lessons ?? []).filter((lesson) => lesson.completedAt !== null).length,
    buildsDone,
})

/**
 * Builds the progress page from what the capabilities answered. Nothing is stored: every number is a read. Projects show only for
 * a subscriber (a free learner gets `projectsLocked`, so the page shows the pitch), and a source that failed leaves its section null.
 */
export const buildProgress = (sources: ProgressSources): LearnerProgressView => {
    const harness = sources.harness === null ? null : buildHarness(sources.harness)
    const isPremium = sources.plan === "premium"
    return {
        plan: sources.plan,
        ribbon: buildRibbon(sources, harness?.buildsDone ?? 0),
        essentials: sources.lessons === null ? null : buildEssentials(sources.lessons, sources.openParts),
        harness,
        projects: isPremium && sources.projects !== null ? buildProjects(sources.projects) : null,
        projectsLocked: !isPremium,
        review: buildReview(sources.review, sources.streak),
        activity: buildActivity(sources),
        unavailable: [...sources.unavailable],
    }
}
