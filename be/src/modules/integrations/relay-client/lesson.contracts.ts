/** One switch of a scenario the learner may turn off to see the red path: the environment variable and the value that turns it off. */
export interface LessonGuard {
    /** The guard name, as in `--guard name=off`. */
    readonly name: string
    /** The environment variable the scenario command reads. */
    readonly env: string
    /** The value of that variable that turns the guard off. */
    readonly off: string
}

/** A hidden test source of a challenge, written for one run only. */
export interface HiddenFile {
    /** The path under the repo folder, relative. */
    readonly path: string
    /** The file content, base64. */
    readonly contentBase64: string
}

/** One allowlisted scenario of a lesson. */
export interface LessonScenario {
    /** The scenario id (`[a-z0-9-]+`). */
    readonly id: string
    /** The title the ledger shows. */
    readonly title: string
    /** What the scenario does, without any solution; the fix prompt quotes it. */
    readonly brief: string
    /** The concepts the scenario proves. */
    readonly concepts: ReadonlyArray<string>
    /** The only command that runs it. */
    readonly command: string
    /** The folder it runs in, relative to the repo folder. */
    readonly cwd: string
    /** The JUnit report it writes, relative to the repo folder. */
    readonly report: string
    /** When it is stopped, in milliseconds. */
    readonly timeoutMs: number
    /** The guards the learner may turn off. */
    readonly guards: ReadonlyArray<LessonGuard>
    /** The hidden test sources of a challenge scenario. */
    readonly files: ReadonlyArray<HiddenFile>
}

/** The lesson section of a verified manifest. */
export interface LessonSection {
    /** The lesson slug. */
    readonly lessonId: string
    /** The tarball of the lesson `source/` folder: where to get it, its sha256 and the content commit it was cut at. */
    readonly source: { readonly url: string; readonly sha256: string; readonly commit: string }
    /** The TypeScript project folder inside the unpacked source. */
    readonly dir: string
    /** The folder with docker-compose.yml, relative to the repo root. */
    readonly compose: string
    /** The compose project name. */
    readonly project: string
    /** The invariant names by id; only ids a run hit are shown. */
    readonly invariants: Readonly<Record<string, string>>
    /** The scenarios the learner may run. */
    readonly scenarios: ReadonlyArray<LessonScenario>
    /** The hidden scenarios of the asked challenge tier, when one was asked. */
    readonly challenge?: { readonly tier: string; readonly scenarios: ReadonlyArray<LessonScenario> }
    /** The Tìm sạn bug pack, when it was asked: the tarball of `bugs/source/` and its tests (the final one only once it is open). */
    readonly bugs?: {
        readonly source: { readonly url: string; readonly sha256: string; readonly commit: string }
        readonly tests: ReadonlyArray<LessonScenario>
    }
}

/** What `pull` leaves in the repo folder so `up`, `down` and `run` need no network to find it. */
export interface LessonState {
    /** The lesson slug. */
    readonly lessonId: string
    /** The content commit the tarball was cut at. */
    readonly commit: string
    /** The sha256 of the tarball that was unpacked. */
    readonly sha256: string
    /** The TypeScript project folder. */
    readonly dir: string
    /** The compose folder. */
    readonly compose: string
    /** The compose project name. */
    readonly project: string
    /** `bugs` for the folder of the Tìm sạn bug pack (`pull --bugs`); absent for the lesson source. */
    readonly pack?: "bugs"
}

/** What `run` and `check` remember locally about the last run of a scenario; never written for a challenge. */
export interface LastRun {
    /** The scenario id. */
    readonly scenarioId: string
    /** Whether it passed. */
    readonly passed: boolean
    /** The guards that were off. */
    readonly guardsOff: ReadonlyArray<string>
    /** The failing tests with their messages. */
    readonly failing: ReadonlyArray<{ readonly name: string; readonly message: string }>
    /** The invariant ids the failure messages named. */
    readonly invariantIds: ReadonlyArray<string>
}

/** The options of a lesson run. */
export interface LessonRunOptions {
    /** One scenario id, or undefined for every scenario (check only). */
    readonly scenario?: string | undefined
    /** The `--guard name=off` pairs. */
    readonly guards: ReadonlyArray<string>
    /** The challenge tier, when the hidden scenarios are run. */
    readonly challenge?: string | undefined
    /** Whether to skip the question. */
    readonly yes: boolean
    /** True to run the Tìm sạn bug pack (every test, results per test id). */
    readonly bugs?: boolean | undefined
}
