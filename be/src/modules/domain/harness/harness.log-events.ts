/** Events the harness capability records; fields are counts, versions and hashes, never content. */
export enum HarnessLogEvent {
    /** One content item was stored, left as it was or refused. */
    Imported = "harness.imported",
    /** A stored record is not the contract's shape (a localized field is missing); the read leaves it out. */
    StoredInvalid = "harness.stored-invalid",
    /** A CI run's harness results were recorded as proof. */
    ProofRecorded = "harness.proof-recorded",
    /** A CI delivery was refused because GitHub did not attest the run. */
    CiRefused = "harness.ci-refused",
    /** A build was bound to a project. */
    Bound = "harness.bound",
}
