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

/** The public catalog of one lesson's source checkout, read from its `starci-source.json`. */
export interface McpCatalog {
    /** The commit the checkout is pinned to. */
    readonly commit: string
    /** The scenarios the learner may run; a hidden scenario is dropped when the file is read. */
    readonly scenarios: ReadonlyArray<McpScenario>
    /** Every invariant with the scenario that reveals it. */
    readonly invariants: ReadonlyArray<McpCatalogInvariant>
    /** The extra path prefixes the teacher keeps out of the AI's reach. */
    readonly deny: ReadonlyArray<string>
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
}

/** One hit of a code or lesson search. */
export interface McpSearchHit {
    /** The path in the repository, or `section/<n>` of the lesson. */
    readonly path: string
    /** The 1-based line of the hit (the first line of the chunk for a semantic hit). */
    readonly line: number
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
