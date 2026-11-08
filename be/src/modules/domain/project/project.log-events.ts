/** Events the project capability records; fields are ids, counts and codes, never code, a secret or a response body. */
export enum ProjectLogEvent {
    /** A proof side effect (experience item, notification, streak) failed; the proof stays recorded. */
    ProofEffectFailed = "project.proof_effect_failed",
    /** A CI delivery was refused before any write. */
    CiRefused = "project.ci_refused",
    /** A signed CI run stayed signed-only practice: GitHub did not vouch for it (the field is the reason). */
    CiUnattested = "project.ci_unattested",
    /** The relay port failed, so the practice results were not refreshed. */
    RelayFailed = "project.relay_failed",
}
