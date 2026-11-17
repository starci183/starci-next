/** One access token as the settings page lists it; the secret is shown once, at creation. */
export interface McpTokenView {
    /** The token id. */
    readonly id: string
    /** The name the learner gave it. */
    readonly name: string
    /** The last four characters of the secret. */
    readonly hint: string
    /** The UTC instant it was created. */
    readonly createdAt: string
    /** The UTC instant a client last used it, or null. */
    readonly lastUsedAt: string | null
}

/** A token just created: the view and the secret, which is never stored and never shown again. */
export interface McpTokenIssued extends McpTokenView {
    /** The secret the learner pastes into the AI client. */
    readonly secret: string
}

/** What the connect page shows: where the endpoint is and how many tokens are allowed. */
export interface McpConnectInfo {
    /** The endpoint address: absolute when `MCP_PUBLIC_URL` is declared, else the path `/mcp`. */
    readonly endpoint: string
    /** How many tokens a learner may hold at once. */
    readonly tokenLimit: number
}

/** A scenario of a lesson as the learner's AI may read it: nothing of a hidden scenario ever appears. */
export interface McpScenario {
    /** The scenario id (a slug). */
    readonly id: string
    /** The title. */
    readonly title: string
    /** The fault the scenario injects, in words. */
    readonly fault: string
    /** The invariant id the scenario shows, or null. */
    readonly invariant: string | null
    /** The guards the scenario may switch off (`--guard <id>=off`). */
    readonly guards: ReadonlyArray<string>
    /** The command the learner runs. */
    readonly command: string
}

/** An invariant of a lesson. */
export interface McpInvariant {
    /** The invariant id. */
    readonly id: string
    /** The short name. */
    readonly name: string
    /** The law in one sentence. */
    readonly statement: string
    /** The file and line where the code keeps it, or null. */
    readonly where: string | null
}

/** An invariant with the scenario that reveals it. */
export interface McpCatalogInvariant extends McpInvariant {
    /** The scenario whose run reveals it, or null when it is open from the start. */
    readonly revealedBy: string | null
}

/** The public catalog of one lesson, projected from its source tree. */
export interface McpCatalog {
    /** The commit the checkout is pinned to. */
    readonly commit: string
    /** The scenarios the learner may run; a hidden scenario is not in the source tree at all. */
    readonly scenarios: ReadonlyArray<McpScenario>
    /** Every invariant with the scenario that reveals it. */
    readonly invariants: ReadonlyArray<McpCatalogInvariant>
}

/** A file read from the lesson repository. */
export interface McpFile {
    /** The path in the repository. */
    readonly path: string
    /** The commit it was read at. */
    readonly commit: string
    /** The first line returned, 1-based. */
    readonly from: number
    /** The last line returned. */
    readonly to: number
    /** How many lines the file has. */
    readonly total: number
    /** The text of the lines, without line numbers. */
    readonly text: string
    /** True when the file goes on after `to`: ask again from `nextFrom`. */
    readonly truncated: boolean
    /** The line to ask for next, or null when `to` is the last line. */
    readonly nextFrom: number | null
}

/** One hit of a code or lesson search. */
export interface McpSearchHit {
    /** The path in the repository, or `section/<n>` of the lesson. */
    readonly path: string
    /** The 1-based line of the hit (the first line of the chunk for a semantic hit). */
    readonly line: number
    /** The 1-based last line of the chunk a semantic hit is, absent for a keyword hit. */
    readonly endLine?: number
    /** The heading trail or the symbol the chunk sits under, when the chunker named one. */
    readonly title?: string
    /** The text of the line or of the chunk, trimmed. */
    readonly text: string
    /** The cosine score of a semantic hit; absent for a keyword hit. */
    readonly score?: number
}

/** The answer of a search: its hits and how they were found. */
export interface McpSearchResult {
    /** `semantic` when the embedder answered, `keyword` otherwise. */
    readonly mode: "semantic" | "keyword"
    /** True when semantic was asked for but the embedder was off or unreachable and keywords answered. */
    readonly fellBack: boolean
    /** The hits, best first. */
    readonly hits: ReadonlyArray<McpSearchHit>
}

/** One run of a scenario on the learner's machine, for "why is this red". */
export interface McpRun {
    /** The run id. */
    readonly runId: string
    /** The scenario id. */
    readonly scenario: string
    /** True when it passed, false when it failed, null while no result arrived. */
    readonly passed: boolean | null
    /** The exit code, or null. */
    readonly exitCode: number | null
    /** The commit it ran on, or null. */
    readonly commit: string | null
    /** The UTC instant of the latest event of the run. */
    readonly at: string
    /** The log the CLI streamed, the tail when long, or null. */
    readonly log: string | null
}

/** What a requested run answers: where it went and what the learner must do. */
export interface McpRunRequested {
    /** True when a signed manifest was sent to an online device; false when no device is listening and the learner runs the command. */
    readonly delivered: boolean
    /** The device the manifest was sent to, or null. */
    readonly device: string | null
    /** The exact command the CLI shows and asks the learner to confirm (or the learner types, when nothing was delivered). */
    readonly command: string
    /** The manifest id, or null when nothing was delivered. */
    readonly manifestId: string | null
}

/** One heading of a section, so the AI can jump to a part of a long text. */
export interface McpHeading {
    /** The level, 1 for `#`. */
    readonly level: number
    /** The heading text. */
    readonly title: string
    /** The 1-based line of the heading in the section body. */
    readonly line: number
}

/** One section of a lesson with its whole text when the learner may read it. */
export interface McpLessonSection {
    /** The number `lesson://<id>/section/<n>` and search hits use. */
    readonly n: number
    /** The section id (`1-essential` for the first part of an Essentials lesson). */
    readonly id: string
    /** The Essentials part it is, or null for a section of another lesson. */
    readonly part: string | null
    /** The phase. */
    readonly phase: string
    /** The title. */
    readonly title: string
    /** True when the learner may not read it (no text then). */
    readonly locked: boolean
    /** The whole markdown body, or null when locked. */
    readonly body: string | null
    /** The headings of the body with their lines. */
    readonly headings: ReadonlyArray<McpHeading>
}

/** One choice of an opener question; the correctness and the explanation appear only after the learner answered it. */
export interface McpOpenerChoice {
    /** The choice id (`c0`, `c1`…). */
    readonly id: string
    /** The choice text. */
    readonly label: string
    /** Whether it is the right one; present once the learner answered the question. */
    readonly isCorrect?: boolean
    /** Why it is right or wrong; present once the learner answered the question. */
    readonly explanation?: string
}

/** One question of the five-question opener of Bản chất. */
export interface McpOpenerQuestion {
    /** The question id. */
    readonly id: string
    /** The question. */
    readonly prompt: string
    /** The choices. */
    readonly choices: ReadonlyArray<McpOpenerChoice>
    /** The heading number of the article to read when it is wrong, or null. */
    readonly sectionRef: string | null
    /** The scenario that shows the answer, or null. */
    readonly scenarioId: string | null
    /** True when the learner submitted an answer in the app, which releases the key below. */
    readonly answered: boolean
    /** The right choice and why, once answered; null before, because the key leaves the server only after a submit. */
    readonly answer: { readonly correctChoiceId: string; readonly explanation: string } | null
}

/** A scenario of Kịch bản with everything the lesson page shows. */
export interface McpLessonScenario {
    /** The scenario id. */
    readonly id: string
    /** The title. */
    readonly title: string
    /** The fault it injects. */
    readonly fault: string
    /** The command the learner runs. */
    readonly command: string
    /** What a correct system shows, as the page shows it. */
    readonly expected: string
    /** The invariant id it judges. */
    readonly invariant: string
    /** The guards the learner may switch off. */
    readonly guards: ReadonlyArray<string>
    /** The hint the page shows when the learner's run is red; null until the learner has a red run of it. */
    readonly hint: string | null
}

/** One entry of the code walk. */
export interface McpCodeWalkEntry {
    /** The entry id. */
    readonly id: string
    /** The heading. */
    readonly title: string
    /** The invariant it keeps. */
    readonly invariant: string
    /** The file. */
    readonly file: string
    /** The first line of the snippet. */
    readonly line: number
    /** The snippet. */
    readonly snippet: string
    /** Why the code is written so, or null. */
    readonly why: string | null
}

/** One rung of the challenge ladder as the lesson page shows it: the brief and the rubric, never the hidden scenarios. */
export interface McpLessonChallenge {
    /** The challenge id. */
    readonly id: string
    /** The rung. */
    readonly level: string
    /** The title. */
    readonly title: string
    /** The brief, markdown. */
    readonly brief: string
    /** The rubric criteria as the learner reads them. */
    readonly rubric: ReadonlyArray<{
        readonly id: string
        readonly criterion: string
        readonly points: number
        readonly isCritical: boolean
    }>
    /** How many hidden scenarios judge it; they are counted, never named. */
    readonly hiddenScenarios: number
    /** The essence-check questions (no key). */
    readonly questions: ReadonlyArray<{
        readonly id: string
        readonly prompt: string
        readonly choices: ReadonlyArray<{ readonly id: string; readonly label: string }>
    }>
}

/** A whole lesson as the learner's AI reads it: every part the learner may read, in full. */
export interface McpLesson {
    /** The lesson id. */
    readonly id: string
    /** The version served. */
    readonly version: string
    /** The locale of the text. */
    readonly locale: string
    /** The title. */
    readonly title: string
    /** The description. */
    readonly description: string
    /** The topic. */
    readonly topic: string
    /** The learning outcomes. */
    readonly outcomes: ReadonlyArray<string>
    /** The prerequisites. */
    readonly prerequisites: ReadonlyArray<string>
    /** The references. */
    readonly references: ReadonlyArray<{
        readonly label: string
        readonly url: string | null
        readonly citation: string
    }>
    /** Whether the learner holds Premium. */
    readonly isPremium: boolean
    /** The parts the learner may not read; they have no text anywhere in this answer. */
    readonly lockedParts: ReadonlyArray<string>
    /** The sections in order, each with its whole body when readable. */
    readonly sections: ReadonlyArray<McpLessonSection>
    /** Part 1: the five-question opener. */
    readonly opener: ReadonlyArray<McpOpenerQuestion>
    /** Part 2: the invariants (also named by part 3). */
    readonly invariants: ReadonlyArray<{ readonly id: string; readonly text: string }>
    /** Part 2: the architecture diagram (mermaid) and its components, when the lesson carries them as data. */
    readonly architecture: {
        readonly diagram: string
        readonly components: ReadonlyArray<{
            readonly name: string
            readonly port: string | null
            readonly role: string | null
            readonly invariants: ReadonlyArray<string>
        }>
    } | null
    /** Part 2: the code walk. */
    readonly codeWalk: ReadonlyArray<McpCodeWalkEntry>
    /** Part 3: the scenarios. */
    readonly scenarios: ReadonlyArray<McpLessonScenario>
    /** Part 4: the challenge ladder. */
    readonly challenges: ReadonlyArray<McpLessonChallenge>
}

/** One file of the lesson source in the listing. */
export interface McpFileEntry {
    /** The path in the source. */
    readonly path: string
    /** The size in bytes (characters of text). */
    readonly bytes: number
    /** The number of lines. */
    readonly lines: number
    /** False for a generated file (a lock file) that is readable but not searched. */
    readonly searchable: boolean
}

/** The files of the lesson source the learner's AI may read. */
export interface McpFileListing {
    /** The pinned commit. */
    readonly commit: string
    /** The readable files in path order. */
    readonly files: ReadonlyArray<McpFileEntry>
}
