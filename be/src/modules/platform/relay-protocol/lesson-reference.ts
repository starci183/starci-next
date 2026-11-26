/**
 * The standard reference repositories, one public repository per lesson in the GitHub organisation `starci-next`, named
 * `essential-<lesson>`, with one top-level folder per language (`typescript/`, later `go/` and `rust/`). Each is written to the
 * harness pattern rules of its concept and runs on its own (no harness, no StarCi CLI).
 *
 * This is the ONE place a reference's repository and pinned commit live: the last page of the lesson links it from here (through the
 * course capability) and `starci-relay ref <lesson>` downloads it from here, so the two cannot drift. A reference whose commit is not a
 * full 40-character sha is not shown and not downloaded.
 */

/** One language folder of a reference repository. */
export interface LessonReferenceLanguage {
    /** The id the learner types after `--lang` (`typescript`). */
    readonly id: string
    /** The folder at the repository root. */
    readonly folder: string
    /** The language and framework, as a label (`TypeScript (NestJS)`). */
    readonly label: string
}

/** The standard reference repository of one lesson. */
export interface LessonReference {
    /** The short name the learner types (`saga`); the repository is `essential-<name>`. */
    readonly name: string
    /** The lesson ids (lab record keys) this reference answers. */
    readonly lessons: ReadonlyArray<string>
    /** `owner/name` on GitHub. */
    readonly repo: string
    /** The full commit sha every link and download is pinned to. */
    readonly commit: string
    /** The day the pinned commit was checked against the comparison. */
    readonly checked: string
    /** The language folders that exist, the default first. */
    readonly languages: ReadonlyArray<LessonReferenceLanguage>
}

/** The organisation every reference repository lives in. */
export const REFERENCE_ORG = "starci-next"

/** A pinned commit: a full lowercase sha. */
const PINNED_COMMIT = /^[0-9a-f]{40}$/u

/** The references; moving a pin is editing `commit` (and `checked`) here, after the comparison was read again at that commit. */
export const LESSON_REFERENCES: ReadonlyArray<LessonReference> = [
    {
        name: "saga",
        lessons: ["saga-compensation"],
        repo: `${REFERENCE_ORG}/essential-saga`,
        commit: "2bddb1d78df0f1640b3f9b13bb9ee8022eb3e40d",
        checked: "2026-11-26",
        languages: [{ id: "typescript", folder: "typescript", label: "TypeScript (NestJS)" }],
    },
]

/** True when the reference's commit is a full sha, the only state in which it is linked or downloaded. */
export const isReferencePinned = (reference: LessonReference): boolean => PINNED_COMMIT.test(reference.commit)

/** The reference a learner names, by its short name or a lesson id it answers; undefined for anything else. */
export const referenceNamed = (
    name: string,
    references: ReadonlyArray<LessonReference> = LESSON_REFERENCES,
): LessonReference | undefined => references.find((each) => each.name === name || each.lessons.includes(name))

/** The reference of a lesson id, pinned, or undefined. */
export const pinnedReferenceOfLesson = (
    lessonId: string,
    references: ReadonlyArray<LessonReference> = LESSON_REFERENCES,
): LessonReference | undefined => {
    const reference = references.find((each) => each.lessons.includes(lessonId))
    return reference !== undefined && isReferencePinned(reference) ? reference : undefined
}

/** The language a learner asks for (the first one when none), or undefined when the reference has no such folder. */
export const referenceLanguageOf = (reference: LessonReference, lang: string | undefined): LessonReferenceLanguage | undefined =>
    lang === undefined ? reference.languages[0] : reference.languages.find((each) => each.id === lang)

/** The page link of one language folder at the pinned commit: `https://github.com/<repo>/tree/<sha>/<folder>`. */
export const referenceTreeUrlOf = (reference: LessonReference, language: LessonReferenceLanguage): string =>
    `https://github.com/${reference.repo}/tree/${reference.commit}/${language.folder}`

/** The tarball of the whole repository at the pinned commit (GitHub's archive host, no login for a public repository). */
export const referenceTarballUrlOf = (reference: LessonReference): string =>
    `https://codeload.github.com/${reference.repo}/tar.gz/${reference.commit}`

/** The folder GitHub puts every file of that tarball under: `<name>-<sha>`. */
export const referenceTarballRootOf = (reference: LessonReference): string =>
    `${reference.repo.slice(reference.repo.indexOf("/") + 1)}-${reference.commit}`

/** The command a learner types to get the reference next to their lab. */
export const referenceCommandOf = (reference: LessonReference, language: LessonReferenceLanguage): string =>
    `starci-relay ref ${reference.name} --lang ${language.id}`
