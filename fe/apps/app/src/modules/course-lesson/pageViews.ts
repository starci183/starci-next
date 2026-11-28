import {
    explainerArt,
    type CourseIntroLabView,
    type CourseIntroView,
    type CoursePatternView,
    type CourseProductionView,
} from "@starci-next/ui"
import { diagramOf } from "./diagram"
import { isGreenNow, loopOf, termOf, type CourseCase, type CourseLessonRecord } from "./lesson"
import { askerOf, termsOf } from "./narration"
import { localized, unquoted, type LocalizedText } from "./views"
import type { CourseIntroWords, CourseLoopWords, CoursePatternWords, CourseProductionWords } from "./words"

/** The text of a service or dependency role in the learner's language. */
const roleOf = (role: LocalizedText, locale: string): string => localized(role, locale)

/**
 * The ticked lines of the first page: the record's own `outcomes` (a line names the unhappy case that teaches it, and the last one none), or,
 * for a record that lists none, one line per unhappy case with its title.
 */
const outcomesOf = (
    lesson: CourseLessonRecord,
    words: CourseIntroWords,
    locale: string,
): CourseIntroView["outcomes"] => {
    const titleOf = (id: string | null): string | undefined => {
        const found = lesson.unhappy.find((each) => each.id === id)
        return found === undefined ? undefined : localized(found.title, locale)
    }
    if (lesson.outcomes.length === 0) {
        return lesson.unhappy.map((each) => ({ id: each.id, can: localized(each.title, locale), caseTitle: "" }))
    }
    return lesson.outcomes.map((each, index) => {
        const title = titleOf(each.caseId)
        return {
            id: `outcome-${index}`,
            can: localized(each.can, locale),
            caseTitle: title === undefined ? "" : words.outcomeCase(title),
        }
    })
}

/**
 * The intro page: the interview scene the record opens with, what the learner will be able to do (one ticked line per unhappy case, then
 * the interview answered), the architecture drawn from the record with the technology of each node and the services in words.
 */
export const introViewOf = (
    lesson: CourseLessonRecord,
    words: CourseIntroWords,
    locale: string,
    staticsBase: string,
    title: string,
): CourseIntroView => {
    const { stack, hook } = lesson
    const art = explainerArt(lesson.concept)
    const diagram = diagramOf(
        lesson,
        {
            entry: words.entry,
            frame: words.frame,
        },
        locale,
    )
    return {
        explainer: art === undefined ? undefined : { asset: art, base: staticsBase, alt: words.explainerAlt(title) },
        hook:
            hook === null
                ? undefined
                : {
                      setup: localized(hook.scene, locale),
                      asker: askerOf(lesson, words.narration, locale),
                      question: unquoted(localized(hook.question, locale)),
                      stumble: localized(hook.stuck, locale),
                      promise: localized(hook.promise, locale),
                  },
        outcomes: outcomesOf(lesson, words, locale),
        terms: termsOf(lesson, locale),
        narrator: words.narration.narrator,
        diagram: diagram.source,
        services: stack.services.map((service) => ({
            id: service.id,
            title: `${service.id} :${service.port}`,
            description: roleOf(service.role, locale),
        })),
        requires: lesson.requires.map((id) => termOf(lesson, id)),
    }
}

/** How many cases the intro's lab card lists before its "+ n" line. */
const LAB_ROWS = 3

/** What the lab card says besides its figures: its title, its command, what the command leads to, and the cases it lists. */
type LabCardWords = {
    readonly title: string
    readonly start: string
    readonly caption: string
    readonly rows: CourseIntroLabView["rows"]
    readonly more: string
}

/** A lab card: the passed figure and bar over every case and the shape of the lab, with the words and the rows the page gives it. */
const labCardOf = (
    lesson: CourseLessonRecord,
    cases: ReadonlyArray<CourseCase>,
    intro: CourseIntroWords,
    card: LabCardWords,
): CourseIntroLabView => {
    const green = cases.filter(isGreenNow).length
    const total = cases.length
    return {
        title: card.title,
        figure: intro.labFigure(green, total),
        percent: total === 0 ? 0 : Math.round((green / total) * 100),
        meta: intro.labMeta({ services: lesson.stack.services.length, happy: lesson.happy.length, unhappy: lesson.unhappy.length }),
        rows: card.rows,
        more: card.more,
        start: card.start,
        caption: card.caption,
    }
}

/**
 * The lab card beside the intro: the passed figure and bar over every case, the shape of the lab, the first cases in the order the learner
 * meets them with their state, and how many are left unlisted.
 */
export const introLabViewOf = (
    lesson: CourseLessonRecord,
    cases: ReadonlyArray<CourseCase>,
    words: CourseIntroWords,
    status: CourseLoopWords["status"],
    locale: string,
): CourseIntroLabView =>
    labCardOf(lesson, cases, words, {
        title: words.labTitle,
        start: words.labStart,
        caption: words.labCaption(cases.length),
        rows: cases.slice(0, LAB_ROWS).map((each) => ({
            id: each.id,
            title: localized(each.spec.title, locale),
            status: each.state,
            statusLabel: status[each.state],
        })),
        more: cases.length > LAB_ROWS ? words.labMore(cases.length - LAB_ROWS) : "",
    })

/** The quote a paragraph opens with (“…”) and the words after it; undefined for a paragraph that does not open with a quote. */
const openingQuoteOf = (paragraph: string): { readonly quote: string; readonly rest: string } | undefined => {
    const found = /^\s*“([^”]+)”\s*/u.exec(paragraph)
    if (found?.[1] === undefined) return undefined
    return { quote: found[1].trim(), rest: paragraph.slice(found[0].length).trim() }
}

/**
 * The recap page (page 6, the recap tab): the record's recall (its title points back to the interview question, its paragraphs retell what
 * the learner did), the interview question itself from the record's hook, the concept's term (the first page allowed to name it, the REF
 * rule), a row per unhappy case with the interviewer's question, what the learner did, what the user gains and the English name, each state
 * read from the newest run, and the full answer the record closes with. A field the record lacks falls back: the app's own lead line for no
 * recall, the case's title for no question, and an empty line (not drawn) for everything else; no word is invented.
 */
export const patternViewOf = (
    lesson: CourseLessonRecord,
    cases: ReadonlyArray<CourseCase>,
    words: CoursePatternWords,
    locale: string,
): CoursePatternView => {
    const { recall, hook, closing } = lesson
    const paragraphs = recall === null ? [] : recall.paragraphs.map((each) => localized(each, locale))
    // A recall that opens by quoting the interview question gives that quote to the page's Quote block (owner 2026-11-28: every interviewer
    // quote is Grammar's Quote) and keeps the rest of its first paragraph as narration; else the hook's question is quoted.
    const opening = openingQuoteOf(paragraphs[0] ?? "")
    const retell = opening === undefined ? paragraphs : [opening.rest, ...paragraphs.slice(1)].filter((each) => each !== "")
    return {
        lead: recall === null ? words.lead : localized(recall.title, locale),
        question: opening !== undefined ? opening.quote : hook === null ? "" : unquoted(localized(hook.question, locale)),
        asker: askerOf(lesson, words.narration, locale),
        terms: termsOf(lesson, locale),
        narrator: words.narration.narrator,
        retell,
        concept: lesson.concept === "" ? "" : termOf(lesson, lesson.concept),
        steps: loopOf(cases, "unhappy").map((each) => ({
            id: each.id,
            question:
                each.spec.question === null
                    ? localized(each.spec.title, locale)
                    : localized(each.spec.question, locale),
            did: each.spec.recap === null ? "" : localized(each.spec.recap.did, locale),
            gain: each.spec.recap === null ? "" : localized(each.spec.recap.gain, locale),
            // The English name serves a Vietnamese reader to search the docs with; an English reader already reads English.
            englishName: locale === "en" || each.spec.recap === null ? "" : each.spec.recap.en,
            // The newest run, not the green of once: a step the learner broke again must not read as done.
            isGreen: isGreenNow(each),
            stateLabel: isGreenNow(each) ? words.greenLabel : words.openLabel,
        })),
        // The composite quotes the answer; the record stores it already quoted, so its own pair is dropped (one pair, never two).
        answer: closing === null ? "" : unquoted(localized(closing.answer, locale)),
    }
}

/**
 * The progress card in the rail of the recap page, the intro's lab card in the same shape: the passed figure and bar over every case, the
 * shape of the lab, and the one command that leads to the submission with what it needs. It lists no case: the rows of the page already do.
 */
export const patternLabViewOf = (
    lesson: CourseLessonRecord,
    cases: ReadonlyArray<CourseCase>,
    words: CoursePatternWords,
    intro: CourseIntroWords,
): CourseIntroLabView =>
    labCardOf(lesson, cases, intro, {
        title: words.labTitle,
        start: words.labStart,
        caption: words.labCaption(cases.length),
        rows: [],
        more: "",
    })

/**
 * The gift of the submit page once the learner's code passed (lessons.md §7, owner 2026-11-28): the StarCi standard the record pins, with
 * its essence, the day it was checked, the relay command that fetches it beside the lab and its folder; then a row per public repo the
 * record lists, each its essence in a few sentences, its language and the files it pins; then what the learner did that none of them
 * ships. No verdict table, no code and no diff: the code is in the repos. Undefined when the record pins neither a standard nor a repo.
 */
export const productionViewOf = (
    lesson: CourseLessonRecord,
    words: CourseProductionWords,
    locale: string,
): CourseProductionView | undefined => {
    const reference = lesson.reference ?? null
    if (lesson.production.length === 0 && reference === null) return undefined
    return {
        standard:
            reference === null
                ? undefined
                : {
                      name: reference.repo,
                      lang: reference.lang,
                      meta: reference.checked === "" ? "" : words.referenceMeta(reference.checked),
                      note: localized(reference.note, locale),
                      command: reference.command,
                      // The link is one language folder of the repository, named by its folder (`typescript/`).
                      link:
                          reference.url === ""
                              ? undefined
                              : { path: `${reference.url.split("/").pop() ?? ""}/`, url: reference.url },
                  },
        repos: lesson.production.map((repo) => ({
            id: repo.repo,
            name: repo.repo,
            meta: words.repoMeta(repo.lang, repo.checked ?? undefined),
            note: localized(repo.note, locale),
            links: repo.files.map((file) => ({ path: file.path, url: file.url })),
        })),
        beyond: lesson.closing === null ? "" : localized(lesson.closing.beyond, locale),
        terms: termsOf(lesson, locale),
    }
}
