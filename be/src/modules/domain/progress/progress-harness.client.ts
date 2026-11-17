import { Injectable } from "@nestjs/common"
import {
    HARNESS_TOOLS,
    HarnessReadService,
    type HarnessBuildView,
    type HarnessDoctorView,
    type HarnessTrapView,
} from "@modules/domain/harness"
import { RelayHarnessService } from "@modules/domain/relay"
import type { ProgressHarnessPort } from "./progress-harness.port"
import type {
    HarnessBuildSource,
    HarnessDoctorSource,
    HarnessEventSource,
    HarnessSource,
    HarnessTrialSource,
    ProgressLocale,
    TrialVerdict,
} from "./progress.contracts"

/** Whether a verdict is one of the three the progress words. */
const isVerdict = (verdict: string): verdict is TrialVerdict =>
    verdict === "held" || verdict === "breached" || verdict === "incomplete"

/** One build as the progress reads it: its stages and how far each goes. */
const buildOf = (build: HarnessBuildView): HarnessBuildSource => ({
    id: build.id,
    title: build.title,
    stages: build.stages.map((stage) => ({ id: stage.id, title: stage.title, state: stage.state })),
})

/** The stage events of builds: a stage with a relayed result, at the time of its newest one. */
const eventsOf = (builds: ReadonlyArray<HarnessBuildView>): ReadonlyArray<HarnessEventSource> =>
    builds.flatMap((build) =>
        build.stages.flatMap((stage): Array<HarnessEventSource> =>
            stage.state === "none" || stage.lastRunAt === null
                ? []
                : [{ id: `${build.id}:${stage.id}`, title: stage.title, at: stage.lastRunAt }],
        ),
    )

/** The doctor run of one tool. */
const doctorOf = (doctor: HarnessDoctorView): HarnessDoctorSource => ({
    tool: doctor.tool,
    passed: doctor.passed,
    total: doctor.total,
    failed: doctor.probes.filter((probe) => probe.status === "failed").length,
})

/** The newest trial of one trap; a verdict the harness does not know counts as not tried. */
const trialOf = (trap: HarnessTrapView): HarnessTrialSource => ({
    trap: trap.id,
    title: trap.title,
    last:
        trap.last === null || !isVerdict(trap.last.verdict)
            ? null
            : { tool: trap.last.tool, verdict: trap.last.verdict, at: trap.last.at },
})

@Injectable()
/**
 * The harness port bound to the harness capability: the builds with the stages the learner proved or practised, the doctor of each
 * tool and the newest trial of each trap, read from the harness content and the results the learner relayed. It stores nothing.
 */
export class ProgressHarnessClient implements ProgressHarnessPort {
    constructor(
        private readonly harness: HarnessReadService,
        private readonly relay: RelayHarnessService,
    ) {}

    /** What the harness holds for a learner, worded in a locale. */
    async read(learnerId: string, locale: ProgressLocale): Promise<HarnessSource> {
        const [buildRows, doctorRows, trialRows] = await Promise.all([
            this.relay.buildResults(learnerId),
            this.relay.doctorResults(learnerId),
            this.relay.trialResults(learnerId),
        ])
        const summaries = await this.harness.builds(learnerId, locale, buildRows)
        const [builds, doctors, traps] = await Promise.all([
            Promise.all(summaries.map((summary) => this.harness.build(learnerId, locale, summary.id, buildRows))),
            Promise.all(HARNESS_TOOLS.map((tool) => this.harness.doctor(tool, locale, doctorRows))),
            this.harness.trials(locale, null, trialRows),
        ])
        return {
            builds: builds.map((build) => buildOf(build)),
            doctor: doctors.map((doctor) => doctorOf(doctor)),
            trials: traps.map((trap) => trialOf(trap)),
            events: eventsOf(builds),
        }
    }
}
