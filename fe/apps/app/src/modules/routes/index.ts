/** Every internal destination the product app's screens link to, named once. */
export const APP_ROUTES = {
    home: "/",
    agents: "/agents",
    devices: "/devices",
    essentials: "/essentials",
    experience: "/experience",
    incidents: "/incidents",
    interview: "/interview",
    premium: "/premium",
    profile: "/profile",
    projects: "/projects",
    projectsNew: "/projects/new",
    practice: "/practice",
    premiumResult: "/premium/result",
    pathsChoose: "/paths/choose",
    review: "/review",
    reviewDecks: "/review/decks",
    reviewQueue: "/review-queue",
    reviewSession: "/review/session",
    signIn: "/sign-in",
    signInCallback: "/sign-in/callback",
} as const

/** The longest return path the identity doors accept. */
const RETURN_TO_MAX_LENGTH = 512

/**
 * A path the reader may be sent back to after signing in: a single leading slash, no `//` or backslash, no whitespace, within the
 * doors' length, and not the sign-in screen itself (with or without a locale prefix), since that would loop. Anything else is
 * undefined, and the caller goes home (contract.identity.session-contract, consumer obligations).
 */
export const returnToOf = (value: string | ReadonlyArray<string> | undefined): string | undefined => {
    const path = typeof value === "string" ? value : undefined
    if (path === undefined || path.length > RETURN_TO_MAX_LENGTH) return undefined
    if (!/^\/(?![/\\])\S*$/.test(path)) return undefined
    if (/^\/(?:[a-z]{2}\/)?sign-in(?:[/?#]|$)/i.test(path)) return undefined
    return path
}

/** The query a sign-in link carries: where to return to, and the one-off notices the screen shows. */
interface SignInQuery {
    readonly returnTo?: string
    readonly signedOut?: boolean
    readonly social?: "failed"
}

/** The query string of a sign-in link, or an empty string when it carries nothing. */
export const signInSearch = (query: SignInQuery): string => {
    const params = new URLSearchParams()
    if (query.returnTo !== undefined) params.set("returnTo", query.returnTo)
    if (query.signedOut === true) params.set("signedOut", "1")
    if (query.social !== undefined) params.set("error", "social")
    const text = params.toString()
    return text === "" ? "" : `?${text}`
}

/** The path of one topic of the Essentials catalog. */
export const topicPath = (topic: string): string => `${APP_ROUTES.essentials}/${encodeURIComponent(topic)}`

/** The path of one tool track of the agent lab. */
export const agentTrackPath = (trackId: string): string => `${APP_ROUTES.agents}/tracks/${encodeURIComponent(trackId)}`

/** The path of one pattern of Practice, with its problems. */
export const practicePatternPath = (patternId: string): string =>
    `${APP_ROUTES.practice}/patterns/${encodeURIComponent(patternId)}`

/** The path of the solve screen of one practice problem. */
export const practiceProblemPath = (slug: string): string => `${APP_ROUTES.practice}/${encodeURIComponent(slug)}`

/** The path of the room of one interview session. */
export const interviewRoomPath = (sessionId: string): string =>
    `${APP_ROUTES.interview}/${encodeURIComponent(sessionId)}`

/** The path of the report of one interview session. */
export const interviewReportPath = (sessionId: string): string => `${interviewRoomPath(sessionId)}/report`

/** The path of one lesson inside its topic, optionally opened on a phase (`/essentials/{topic}/{lesson}?phase=predict`). */
export const lessonPath = (topic: string, lesson: string, phase?: string): string => {
    const base = `${topicPath(topic)}/${encodeURIComponent(lesson)}`
    return phase === undefined ? base : `${base}?phase=${encodeURIComponent(phase)}`
}

/**
 * The sign-in address that sends the reader back to `returnTo` (a path with its query, already in the reader's locale) once
 * signed in: `signInPath` alone when `returnTo` is not a path the doors accept (the sign-in screen itself, a foreign address).
 */
export const signInRedirectHref = (signInPath: string, returnTo: string): string => {
    const accepted = returnToOf(returnTo)
    return signInPath + signInSearch(accepted === undefined ? {} : { returnTo: accepted })
}

/** The path of one item under review (`/review-queue/{itemId}`), for the teacher and reviewers. */
export const reviewItemPath = (itemId: string): string => `${APP_ROUTES.reviewQueue}/${encodeURIComponent(itemId)}`

/** The public verification page of one verified item (`/verify/{code}`). */
export const verifyPath = (code: string): string => `/verify/${encodeURIComponent(code)}`

/** The path of one project of the learner. */
export const projectPath = (projectId: string): string => `${APP_ROUTES.projects}/${encodeURIComponent(projectId)}`

/** The path of one milestone of a project, with its concept checklist. */
export const projectMilestonePath = (projectId: string, milestoneId: string): string =>
    `${projectPath(projectId)}/${encodeURIComponent(milestoneId)}`
