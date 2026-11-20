/** The request of the viewerRoles door: the roles of the signed-in account the guard established. */
export interface GetViewerRolesRequest {
    /** The roles of the account. */
    readonly roles: ReadonlyArray<string>
}
