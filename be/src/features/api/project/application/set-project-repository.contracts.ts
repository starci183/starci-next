/** What binding a project to a GitHub repository takes. */
export interface SetProjectRepositoryRequest {
    /** The project. */
    readonly projectId: string
    /** `owner/name`, or a github.com address. */
    readonly repository: string
}
