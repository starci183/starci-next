import type {
    HarnessBuildSource,
    HarnessDoctorSource,
    HarnessSource,
    HarnessTrialSource,
    HarnessVerdict,
    ProgressBuildView,
    ProgressDoctorView,
    ProgressHarnessView,
    ProgressTrialView,
    ProofState,
} from "./progress.contracts"

/** A stage count's state: proved when every stage is proved, practising when any stage has a result, else none. */
export const buildStateOf = (stages: HarnessBuildSource["stages"]): ProofState => {
    if (stages.length > 0 && stages.every((stage) => stage.state === "proved")) return "proved"
    return stages.some((stage) => stage.state !== "none") ? "practising" : "none"
}

const buildOf = (build: HarnessBuildSource): ProgressBuildView => ({
    buildId: build.id,
    title: build.title,
    state: buildStateOf(build.stages),
    stagesProved: build.stages.filter((stage) => stage.state === "proved").length,
    stagesPractising: build.stages.filter((stage) => stage.state === "practising").length,
    stagesTotal: build.stages.length,
    stages: build.stages.map((stage) => ({ stageId: stage.id, title: stage.title, state: stage.state })),
})

/** The doctor verdict: not run when no probe ran, failed when any probe failed, passed when all passed. */
export const doctorVerdictOf = (doctor: HarnessDoctorSource): HarnessVerdict => {
    if (doctor.failed > 0) return "failed"
    return doctor.total > 0 && doctor.passed === doctor.total ? "passed" : "not-run"
}

const doctorOf = (doctor: HarnessDoctorSource): ProgressDoctorView => ({
    tool: doctor.tool,
    verdict: doctorVerdictOf(doctor),
    passed: doctor.passed,
    total: doctor.total,
})

const trialOf = (trial: HarnessTrialSource): ProgressTrialView => ({
    trap: trial.trap,
    title: trial.title,
    tool: trial.last?.tool ?? null,
    verdict: trial.last?.verdict ?? null,
    at: trial.last?.at ?? null,
})

/** The Harness section: builds with their stages, the doctor verdict per tool and the newest trial per trap. */
export const buildHarness = (source: HarnessSource): ProgressHarnessView => {
    const builds = source.builds.map((build) => buildOf(build))
    return {
        buildsDone: builds.filter((build) => build.state === "proved").length,
        buildsTotal: builds.length,
        builds,
        doctor: source.doctor.map((doctor) => doctorOf(doctor)),
        trials: source.trials.map((trial) => trialOf(trial)),
    }
}
