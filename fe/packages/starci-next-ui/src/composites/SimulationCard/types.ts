/** The words of a simulation card, resolved by its block. */
export type SimulationCardLabels = {
    /** Heading of the row of states. */
    readonly states: string
    /** Heading of the list of next steps. */
    readonly moves: string
    /** Heading of the event log. */
    readonly log: string
    /** The log while nothing was tried. */
    readonly logEmpty: string
    /** The mark under the state the learner is in now. */
    readonly current: string
    /** The status of a branch already tried. */
    readonly tried: string
    /** The status of a branch not tried yet. */
    readonly untried: string
    /** The status of a branch the current state has no transition for; its button is disabled. */
    readonly unavailable: string
    /** The line over the observation of the current state. */
    readonly observing: string
    /** The same line when the current state is a goal. */
    readonly succeeded: string
    /** The progress line; `{tried}` and `{total}` are replaced ("Tried {tried}/{total} branches"). */
    readonly progress: string
    readonly back: string
    readonly restart: string
    /** Said when the list of next steps is empty. */
    readonly noMoves: string
}

/** One state of the machine. */
export type SimulationState = {
    readonly id: string
    readonly label: string
    /** The observation shown while the learner is in this state. */
    readonly observation: string
    /** True when the state is a goal. */
    readonly isSuccess: boolean
    /** Optional counters of the state (charges: 1, last response: 201), drawn as figures while it is current. */
    readonly facts?: ReadonlyArray<{ readonly label: string; readonly value: string }>
}

/** One action the learner can press. Every action is a button, in every state. */
export type SimulationAction = {
    readonly id: string
    readonly label: string
    /** False for a plain step that does not count toward "tried n/m branches"; omitted, the action counts. */
    readonly isBranch?: boolean
}

/** One edge: pressing `actionId` in `fromStateId` leads to `toStateId`. */
export type SimulationTransition = {
    readonly fromStateId: string
    readonly actionId: string
    readonly toStateId: string
}

/** One press of the walk, kept so that it can be saved and replayed. */
export type SimulationStep = {
    readonly actionId: string
    readonly toStateId: string
    /** ISO time of the press. */
    readonly at: string
}

/** What `onChange` reports after every press, back and restart; `steps` and `triedActionIds` resume the card. */
export type SimulationProgress = {
    readonly steps: ReadonlyArray<SimulationStep>
    readonly currentStateId: string
    readonly isSuccess: boolean
    /** The branches pressed at least once over the whole visit (going back does not forget them). */
    readonly triedActionIds: ReadonlyArray<string>
    readonly triedCount: number
    readonly totalCount: number
}

/** One simulation: the machine, the words and the walk it starts from. The card keeps its own walk and reports it. */
export type SimulationCardProps = {
    /** The lead-in sentence. */
    readonly prompt: string
    readonly initialStateId: string
    readonly states: ReadonlyArray<SimulationState>
    readonly actions: ReadonlyArray<SimulationAction>
    readonly transitions: ReadonlyArray<SimulationTransition>
    readonly labels: SimulationCardLabels
    /** The walk to resume (saved earlier); omitted, the card starts at the initial state. Read once, at mount. */
    readonly initialSteps?: ReadonlyArray<SimulationStep>
    /** The branches tried in an earlier visit, so that the count survives a reload after "restart". Read once; omitted, taken from `initialSteps`. */
    readonly initialTriedActionIds?: ReadonlyArray<string>
    /** Called after every change of the walk, so that the app persists it. */
    readonly onChange?: (progress: SimulationProgress) => void
}

/** The walk and the branches ever tried. */
export type Walk = { readonly steps: ReadonlyArray<SimulationStep>; readonly tried: ReadonlyArray<string> }
