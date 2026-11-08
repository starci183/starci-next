import type { ExperienceLocale, LocalizedLine, SlotValues } from "./career.contracts"
import { CareerError, CareerErrorCode } from "./errors/career.error"
import { templateOf, type CatalogItem } from "./experience-catalog.policy"

/** The locales every line carries. */
const LOCALES: ReadonlyArray<ExperienceLocale> = ["vi", "en"]

/** A run of digits, with an inner decimal point or comma: a figure a learner may not add. */
const FIGURE = /\d+(?:[.,]\d+)?/gu

/** Fills one template, refusing a slot the evidence left empty, since a line never carries an unfilled slot. */
const fill = (template: string, slots: ReadonlyArray<string>, values: Readonly<Record<string, string>>): string =>
    slots.reduce((line, slot) => {
        const value = values[slot]
        if (value === undefined || value.trim() === "") throw new CareerError({ code: CareerErrorCode.ItemTypeUnknown })
        return line.split(`<${slot}>`).join(value)
    }, template)

/** Drafts the line of an item in both locales from its template, every slot filled from the evidence values. */
export const draftLineOf = (item: CatalogItem, values: SlotValues): LocalizedLine => {
    const template = templateOf(item.itemType)
    return { vi: fill(template.vi, item.slots, values.vi), en: fill(template.en, item.slots, values.en) }
}

/** The figures of a text. */
const figuresOf = (text: string): ReadonlyArray<string> => text.match(FIGURE) ?? []

/** Whether a reworded line keeps every filled value and adds no figure the draft does not hold. */
const keepsEvidence = (line: string, draft: string, values: Readonly<Record<string, string>>): boolean => {
    const known = new Set(figuresOf(draft))
    return Object.values(values).every((value) => line.includes(value)) && figuresOf(line).every((f) => known.has(f))
}

/**
 * Accepts the line a learner submits: the draft, or a rewording that keeps every value filled from the evidence and adds no
 * figure ("reword the line, never the figures"). Anything else is refused CAREER_LINE_SLOT_CHANGED.
 */
export const acceptLine = (line: LocalizedLine, draft: LocalizedLine, values: SlotValues): LocalizedLine => {
    const trimmed: LocalizedLine = { vi: line.vi.trim(), en: line.en.trim() }
    const kept = LOCALES.every((locale) => keepsEvidence(trimmed[locale], draft[locale], values[locale]))
    if (!kept) throw new CareerError({ code: CareerErrorCode.LineSlotChanged })
    return trimmed
}

/** Whether two lines are the same in both locales. */
export const sameLine = (left: LocalizedLine | null, right: LocalizedLine): boolean =>
    left !== null && left.vi === right.vi && left.en === right.en
