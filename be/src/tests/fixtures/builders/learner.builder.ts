import { fakeIds } from "@starci/jest-preset"

/** The body of a refusal as the common filter writes it. */
export interface RefusalBody {
    readonly code: string
    readonly kind: string
    readonly params: Readonly<Record<string, string | number>>
}

/** What a sign-in, refresh or session door answers: the access token and the person it was issued to. */
export interface GrantBody {
    readonly accessToken: string
    readonly expiresIn: number
    readonly expiresAt: string
    readonly user: { readonly id: string; readonly email: string; readonly name?: string }
}

/** A person who signs up with an address and a password. */
export interface Learner {
    readonly username: string
    readonly email: string
    readonly password: string
}

/** A source of learners that never repeats a name, so tests of one file never share an account. */
export const learnersOf = (prefix: string): (() => Learner) => {
    const ids = fakeIds(prefix)
    return () => {
        const id = ids.next().toLowerCase()
        return { username: id, email: `${id}@starci.test`, password: `${id}-passphrase` }
    }
}

/** The keys of a body in a stable order. */
export const keysOf = (body: object): Array<string> => Object.keys(body).sort((a, b) => a.localeCompare(b))
