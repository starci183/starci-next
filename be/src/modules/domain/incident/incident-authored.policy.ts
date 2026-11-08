import type { IncidentStatus } from "./incident.contracts"

/**
 * The lessons whose tier-2 incident is written. None is authored yet (the incident repos and the runner come later), so the
 * list shows every live lesson as coming soon; the app root names a lesson here once its incident ships.
 */
export const DEFAULT_AUTHORED_INCIDENTS: ReadonlyArray<string> = []

/** The status of the incident of a lesson: authored only when the lesson is named among the authored ones. */
export const incidentStatusOf = (lessonId: string, authored: ReadonlyArray<string>): IncidentStatus =>
    authored.includes(lessonId) ? "authored" : "coming-soon"

/** Orders authored incidents before coming-soon ones and keeps the catalog order inside each. */
export const incidentRank = (status: IncidentStatus): number => (status === "authored" ? 0 : 1)
