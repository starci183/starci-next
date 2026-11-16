/** One file of the `source/` folder of a lesson, its path relative to that folder. */
export interface LessonSourceTreeFile {
    /** The path inside `source/`, posix. */
    readonly path: string
    /** The text. */
    readonly text: string
}

/** A scenario of the lesson as a reader of its source may know it: nothing of the expected output, the hint or a hidden scenario. */
export interface LessonSourceTreeScenario {
    /** The scenario id. */
    readonly id: string
    /** The title. */
    readonly title: string
    /** The fault it injects, in words. */
    readonly fault: string
    /** The invariant id it judges. */
    readonly invariant: string
    /** The names of the guards that may be switched off. */
    readonly guards: ReadonlyArray<string>
}

/** An invariant of the lesson with where its code lives, when the code walk says. */
export interface LessonSourceTreeInvariant {
    /** The invariant id. */
    readonly id: string
    /** The rule in one line. */
    readonly text: string
    /** `file:line` inside `source/`, or null. */
    readonly where: string | null
}

/**
 * The source of the live version of a lesson as it may be read: the files of `source/` at the content commit the version was
 * imported at, the public scenarios and the invariants. `hidden/` (the hidden challenge tests), the challenge rubric, the hidden
 * scenarios and every expected output and hint are not part of it by construction.
 */
export interface LessonSourceTree {
    /** The content commit the version was imported at: the pin every file is read at. */
    readonly commit: string
    /** The files of `source/`, in path order. */
    readonly files: ReadonlyArray<LessonSourceTreeFile>
    /** The public scenarios. */
    readonly scenarios: ReadonlyArray<LessonSourceTreeScenario>
    /** The invariants. */
    readonly invariants: ReadonlyArray<LessonSourceTreeInvariant>
}
