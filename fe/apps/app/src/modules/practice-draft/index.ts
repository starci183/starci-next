import type { PracticeLanguageId } from "@/modules/types"

/** The browser's local storage, or null where there is none (server render, storage blocked by the browser). */
const localStorageOrNull = (): Storage | null => {
    if (typeof window === "undefined") return null
    try {
        return window.localStorage
    } catch {
        return null
    }
}

/** The key a draft is kept under, per problem and language. */
const draftKeyOf = (slug: string, language: PracticeLanguageId): string => `starci.practice.draft.${slug}.${language}`

/** The key the language last chosen on a problem is kept under. */
const languageKeyOf = (slug: string): string => `starci.practice.language.${slug}`

/** Reads one stored value; undefined when there is none or the browser keeps nothing. */
const read = (key: string): string | undefined => {
    const storage = localStorageOrNull()
    if (storage === null) return undefined
    try {
        return storage.getItem(key) ?? undefined
    } catch {
        return undefined
    }
}

/** Keeps one value for the next visit; answers false when the browser keeps nothing (the page works without the draft). */
const write = (key: string, value: string): boolean => {
    const storage = localStorageOrNull()
    if (storage === null) return false
    try {
        storage.setItem(key, value)
        return true
    } catch {
        return false
    }
}

/** Forgets one stored value; answers false when the browser could not. */
const forget = (key: string): boolean => {
    const storage = localStorageOrNull()
    if (storage === null) return false
    try {
        storage.removeItem(key)
        return true
    } catch {
        return false
    }
}

/** The draft the learner last wrote for a problem in a language, if this browser kept one. */
export const readDraft = (slug: string, language: PracticeLanguageId): string | undefined =>
    read(draftKeyOf(slug, language))

/** Keeps the draft of a problem in a language; false when the browser keeps nothing. */
export const writeDraft = (slug: string, language: PracticeLanguageId, code: string): boolean =>
    write(draftKeyOf(slug, language), code)

/** Forgets the draft of a problem in a language (back to the starter code). */
export const clearDraft = (slug: string, language: PracticeLanguageId): boolean => forget(draftKeyOf(slug, language))

/** The language the learner last chose on a problem, if this browser kept one. */
export const readLanguage = (slug: string): string | undefined => read(languageKeyOf(slug))

/** Keeps the language chosen on a problem; false when the browser keeps nothing. */
export const writeLanguage = (slug: string, language: PracticeLanguageId): boolean =>
    write(languageKeyOf(slug), language)
