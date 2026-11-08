import { ProjectError, ProjectErrorCode } from "./errors/project.error"

/** An owner and a repository name as GitHub spells them: an owner of letters, digits and inner hyphens, a name of letters, digits, `.`, `_` and `-`. */
const REPOSITORY = /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)\/([A-Za-z0-9._-]{1,100})$/u

/** The address form a learner may paste instead, `https://github.com/owner/name` with an optional `.git`. */
const ADDRESS = /^https:\/\/github\.com\/([^/\s]+\/[^/\s]+?)(?:\.git)?\/?$/u

/**
 * The repository a project binds to, as `owner/name`: the form itself, or a pasted github.com address reduced to it. Anything else
 * is refused PROJECT_REPOSITORY_INVALID; GitHub compares names without case, so the binding is kept as typed and compared lowered.
 */
export const repositoryOf = (input: string): string => {
    const trimmed = input.trim()
    const candidate = ADDRESS.exec(trimmed)?.[1] ?? trimmed
    const match = REPOSITORY.exec(candidate)
    if (match === null || match[2] === "." || match[2] === "..")
        throw new ProjectError({ code: ProjectErrorCode.RepositoryInvalid })
    return candidate
}
