import {
    LESSON_CHALLENGE_LEVELS,
    type LessonChallenge,
    type LessonEssential,
    type LessonScenarioRun,
} from "@modules/domain/lesson"
import type { ManifestLesson, ManifestLessonScenario } from "./relay-feed.contracts"
import { commitOf } from "./relay-harness-manifest.policy"

/** Where the CLI fetches a lesson's `source/` tarball, its hash and the content commit it was cut at. */
export type LessonSourceLink = ManifestLesson["source"]

/** The path of a lesson's source tarball on the StarCi origin; the CLI sends its device token to it (SCENARIO-CONTRACT v3 §4). */
export const lessonSourcePathOf = (lessonId: string): string => `/api/relay/lessons/${lessonId}/source.tgz`

/** The path of a lesson's Tìm sạn bug pack tarball (`bugs/source/`) on the StarCi origin; the CLI sends its device token to it. */
export const lessonBugsPathOf = (lessonId: string): string => `/api/relay/lessons/${lessonId}/bugs.tgz`

/** The largest source tarball the CLI takes. */
export const LESSON_SOURCE_MAX_BYTES: number = 50 * 1024 * 1024

/** The prefix of a lesson task id: `lesson:<lesson slug>`. */
export const LESSON_TASK_PREFIX = "lesson:"

/** How long a scenario may run when the lesson names no limit. */
const DEFAULT_TIMEOUT_MS = 300_000

/** The value that turns a guard off when the lesson names none. */
const DEFAULT_OFF = "off"

/** The lesson slug of a lesson task id, or null for any other task. */
export const lessonIdOfTask = (taskId: string): string | null => {
    if (!taskId.startsWith(LESSON_TASK_PREFIX)) return null
    const id = taskId.slice(LESSON_TASK_PREFIX.length)
    return /^[a-z0-9-]{1,100}$/u.test(id) ? id : null
}

/** Joins a folder and a path, the folder `.` meaning the repository root. */
const under = (folder: string, path: string): string => (folder === "." ? path : `${folder}/${path}`)

/** What every scenario of a lesson shares: the folder it runs in when it names none. */
interface RunDefaults {
    readonly dir: string
}

/** One scenario (plain or hidden) with the defaults filled in, in the order the CLI reads. */
const scenarioOf = (
    scenario: LessonScenarioRun & { readonly id: string; readonly title: string; readonly command: string },
    defaults: RunDefaults,
    extra: Pick<ManifestLessonScenario, "guards" | "files"> & { readonly fallbackBrief: string },
): ManifestLessonScenario => {
    const cwd = scenario.cwd ?? defaults.dir
    return {
        id: scenario.id,
        title: scenario.title,
        brief: scenario.brief ?? extra.fallbackBrief,
        concepts: [...(scenario.concepts ?? [])],
        command: scenario.command,
        cwd,
        report: scenario.report ?? under(cwd, "reports/junit.xml"),
        timeoutMs: scenario.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        guards: extra.guards,
        ...(extra.files === undefined ? {} : { files: extra.files }),
    }
}

/** The hidden scenarios of a challenge with their test sources in base64. */
const hiddenOf = (challenge: LessonChallenge, defaults: RunDefaults): ReadonlyArray<ManifestLessonScenario> =>
    (challenge.hidden ?? []).map((hidden) =>
        scenarioOf(hidden, defaults, {
            fallbackBrief: hidden.title,
            guards: [],
            files: (hidden.files ?? []).map((file) => ({
                path: file.path,
                contentBase64: Buffer.from(file.content ?? "", "utf8").toString("base64"),
            })),
        }),
    )

/** What a lesson manifest is asked for: one scenario, the hidden scenarios of a tier, or neither. */
export interface LessonManifestAsk {
    /** The scenario id, when one is asked. */
    readonly scenario?: string | undefined
    /** The challenge tier, when one is asked. */
    readonly challenge?: string | undefined
    /** True when the bug pack is asked. */
    readonly bugs?: boolean | undefined
}

/** What signing the bug pack needs: its tarball link, and whether the final test is open (every other test green). */
export interface LessonBugsSigning {
    /** The tarball of `bugs/source/`, or null when the lesson ships none (or it is too large). */
    readonly link: LessonSourceLink | null
    /** True once every test but the final one passed. */
    readonly isFinalOpen: boolean
}

/** Why a lesson cannot be signed for the ask, or the section to sign. */
export type LessonManifestResult =
    | { readonly kind: "section"; readonly lesson: ManifestLesson }
    | { readonly kind: "not-runnable" }
    | { readonly kind: "locked" }

/** The tier below a tier, or null for the first. */
export const tierBelow = (tier: string): string | null => {
    const index = LESSON_CHALLENGE_LEVELS.findIndex((each) => each === tier)
    return index <= 0 ? null : (LESSON_CHALLENGE_LEVELS[index - 1] ?? null)
}

/**
 * Builds the signed lesson section (SCENARIO-CONTRACT v3 §2) from the stored four-part fields: the source tarball, the
 * folders, the invariant names, every scenario in teaching order and, for an unlocked tier, its hidden scenarios with their
 * sources. The link commits are pinned as 40 hex (`commitOf`: a seeded version is a 12-character content label, not a git sha). A lesson without a source tarball, without scenarios, an unknown scenario and an unknown tier are not runnable; `isUnlocked`
 * says whether the asked tier is open (the tier below is all green).
 */
export const lessonManifestOf = (
    lessonId: string,
    essential: LessonEssential,
    ask: LessonManifestAsk,
    isUnlocked: (tier: string) => boolean,
    link: LessonSourceLink | null,
    bugs: LessonBugsSigning = { link: null, isFinalOpen: false },
): LessonManifestResult => {
    const source = essential.source
    if (link === null || essential.scenarios.length === 0) return { kind: "not-runnable" }
    if (ask.scenario !== undefined && !essential.scenarios.some((scenario) => scenario.id === ask.scenario))
        return { kind: "not-runnable" }
    const dir = source?.dir ?? "."
    const defaults: RunDefaults = { dir }
    const base: ManifestLesson = {
        lessonId,
        source: { ...link, commit: commitOf(link.commit) },
        dir,
        compose: source?.compose ?? under(dir, ".docker"),
        project: source?.project ?? lessonId,
        invariants: Object.fromEntries(
            [...essential.invariants, ...(essential.hiddenInvariants ?? [])].map((invariant) => [
                invariant.id,
                invariant.text,
            ]),
        ),
        scenarios: essential.scenarios.map((scenario) =>
            scenarioOf(scenario, defaults, {
                fallbackBrief: scenario.fault,
                guards: scenario.guards.map((guard) => ({
                    name: guard.name,
                    env: guard.env,
                    off: guard.off ?? DEFAULT_OFF,
                })),
            }),
        ),
    }
    if (ask.bugs === true) {
        const pack = essential.bugs
        if (pack === undefined || pack === null || pack.tests.length === 0 || bugs.link === null)
            return { kind: "not-runnable" }
        const tests = pack.tests
            .filter((test) => !test.isFinal || bugs.isFinalOpen)
            .map((test) => scenarioOf(test, defaults, { fallbackBrief: test.title, guards: [] }))
        return {
            kind: "section",
            lesson: { ...base, bugs: { source: { ...bugs.link, commit: commitOf(bugs.link.commit) }, tests } },
        }
    }
    if (ask.challenge === undefined) return { kind: "section", lesson: base }
    const challenge = essential.challenges.find((each) => each.level === ask.challenge)
    if (challenge === undefined || (challenge.hidden ?? []).length === 0) return { kind: "not-runnable" }
    if (!isUnlocked(challenge.level)) return { kind: "locked" }
    return {
        kind: "section",
        lesson: { ...base, challenge: { tier: challenge.level, scenarios: hiddenOf(challenge, defaults) } },
    }
}
