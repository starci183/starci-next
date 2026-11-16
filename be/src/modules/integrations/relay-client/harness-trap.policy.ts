import { parse } from "yaml"
import { isRecord } from "@modules/platform/primitives"
import { HARNESS_TOOLS, type Detect, type HarnessTool, type PassRule, type Trap, type TrapShortcut } from "./harness-trial.contracts"

/** What reading a trap file answered. */
export type TrapRead = { readonly ok: true; readonly trap: Trap } | { readonly ok: false; readonly issues: ReadonlyArray<string> }

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/u
const RULES = ["verify-green", "protect-intact", "keep-intact", "no-shortcut", "committed", "committed-or-explained", "observed"]
const DETECT_IN = ["command", "read", "write", "diff", "message"]

/** A localized text as one text: a plain string is both languages. */
export const localizedOf = (value: unknown, lang: string): string => {
    if (typeof value === "string") return value
    if (isRecord(value)) {
        const picked = value[lang] ?? value["en"] ?? value["vi"]
        if (typeof picked === "string") return picked
    }
    return ""
}

const texts = (value: unknown, at: string, issues: Array<string>, minimum = 0): ReadonlyArray<string> => {
    const list: ReadonlyArray<unknown> = Array.isArray(value) ? (value as ReadonlyArray<unknown>) : []
    if (!Array.isArray(value) || list.length < minimum || !list.every((item) => typeof item === "string" && item !== "")) {
        issues.push(`${at} must be a list of ${minimum > 0 ? "at least one " : ""}non-empty texts`)
        return []
    }
    return list as ReadonlyArray<string>
}

const regexOk = (value: string): boolean => {
    try {
        void new RegExp(value, "imu")
        return true
    } catch {
        return false
    }
}

const detectOf = (raw: unknown, at: string, issues: Array<string>): Detect | null => {
    if (!isRecord(raw) || !DETECT_IN.includes(String(raw["in"]))) {
        issues.push(`${at}.in must be one of ${DETECT_IN.join(", ")}`)
        return null
    }
    const matches = typeof raw["matches"] === "string" && raw["matches"] !== "" ? raw["matches"] : undefined
    if (matches !== undefined && !regexOk(matches)) issues.push(`${at}.matches is not a regex`)
    const paths = raw["paths"] === undefined ? undefined : texts(raw["paths"], `${at}.paths`, issues, 1)
    if (raw["in"] !== "message" && matches === undefined && paths === undefined) issues.push(`${at} needs matches or paths`)
    const atLeast = typeof raw["atLeast"] === "number" && Number.isInteger(raw["atLeast"]) && raw["atLeast"] >= 1 ? raw["atLeast"] : undefined
    return {
        in: raw["in"] as Detect["in"],
        ...(matches === undefined ? {} : { matches }),
        ...(paths === undefined ? {} : { paths }),
        ...(atLeast === undefined ? {} : { atLeast }),
        ...(raw["absent"] === true ? { absent: true } : {}),
    }
}

const shortcutOf = (raw: unknown, at: string, issues: Array<string>, lang: string): TrapShortcut | null => {
    if (!isRecord(raw) || typeof raw["id"] !== "string" || !SLUG.test(raw["id"]) || !Array.isArray(raw["detect"]) || raw["detect"].length === 0) {
        issues.push(`${at} needs an id and at least one detect`)
        return null
    }
    const detect = (raw["detect"] as ReadonlyArray<unknown>).flatMap((item, index) => detectOf(item, `${at}.detect.${index}`, issues) ?? [])
    return { id: raw["id"], title: localizedOf(raw["title"], lang) || raw["id"], detect }
}

const ruleOf = (raw: unknown, at: string, issues: Array<string>, lang: string): PassRule | null => {
    if (!isRecord(raw) || !RULES.includes(String(raw["rule"]))) {
        issues.push(`${at}.rule must be one of ${RULES.join(", ")}`)
        return null
    }
    const shortcuts = raw["shortcuts"] === undefined ? [] : texts(raw["shortcuts"], `${at}.shortcuts`, issues, 1)
    if (raw["rule"] === "no-shortcut" && shortcuts.length === 0) issues.push(`${at}: no-shortcut needs shortcuts`)
    return {
        rule: String(raw["rule"]),
        text: localizedOf(raw["text"], lang),
        shortcuts,
        tolerateBlocked: raw["tolerateBlocked"] === true,
        reportOnly: raw["reportOnly"] === true,
    }
}

const numberOf = (value: unknown, at: string, issues: Array<string>, integer: boolean): number => {
    if (typeof value === "number" && value >= 0 && (!integer || Number.isInteger(value))) return value
    issues.push(`${at} must be a ${integer ? "whole " : ""}number`)
    return 0
}

/** Reads `trap.yaml` (the content repository's `schemas/harness-trap.schema.json`): the fields the trial reads, every problem listed. */
export const trapOf = (text: string, lang: string): TrapRead => {
    const issues: Array<string> = []
    let raw: unknown
    try {
        raw = parse(text) as unknown
    } catch (cause) {
        return { ok: false, issues: [cause instanceof Error ? (cause.message.split("\n")[0] ?? "not YAML") : "not YAML"] }
    }
    if (!isRecord(raw) || Array.isArray(raw)) return { ok: false, issues: ["the file must be a map"] }
    const id = typeof raw["id"] === "string" && SLUG.test(raw["id"]) ? raw["id"] : ""
    if (id === "") issues.push("id must be a slug")
    const prompt = typeof raw["prompt"] === "string" ? raw["prompt"].trim() : ""
    if (prompt === "") issues.push("prompt must be a text")
    const listed = texts(raw["tools"], "tools", issues, 1)
    const tools = listed.filter((tool): tool is HarnessTool => (HARNESS_TOOLS as ReadonlyArray<string>).includes(tool))
    if (listed.length > 0 && tools.length !== listed.length) issues.push("tools must be claude or codex")
    const verify = isRecord(raw["verify"]) ? raw["verify"] : {}
    const command = typeof verify["command"] === "string" ? verify["command"].trim() : ""
    if (command === "") issues.push("verify.command must be a text")
    const budget = isRecord(raw["budget"]) ? raw["budget"] : {}
    const shortcuts = (Array.isArray(raw["shortcuts"]) ? (raw["shortcuts"] as ReadonlyArray<unknown>) : []).flatMap(
        (item, index) => shortcutOf(item, `shortcuts.${index}`, issues, lang) ?? [],
    )
    if (shortcuts.length === 0) issues.push("shortcuts must list at least one shortcut")
    const pass = isRecord(raw["pass"]) ? raw["pass"] : {}
    const rulesOf = (tool: HarnessTool): ReadonlyArray<PassRule> =>
        (Array.isArray(pass[tool]) ? (pass[tool] as ReadonlyArray<unknown>) : []).flatMap((item, index) => ruleOf(item, `pass.${tool}.${index}`, issues, lang) ?? [])
    const rules = { claude: rulesOf("claude"), codex: rulesOf("codex") }
    HARNESS_TOOLS.forEach((tool) => {
        if (rules[tool].length === 0) issues.push(`pass.${tool} needs rules`)
        rules[tool]
            .flatMap((rule) => rule.shortcuts)
            .filter((shortcut) => !shortcuts.some((known) => known.id === shortcut))
            .forEach((shortcut) => issues.push(`pass.${tool}: shortcut ${shortcut} is not declared`))
    })
    const trap: Trap = {
        id,
        title: localizedOf(raw["title"], lang) || id,
        prompt,
        tools,
        setup: raw["setup"] === undefined ? [] : texts(raw["setup"], "setup", issues),
        verify: { command, report: typeof verify["report"] === "string" ? verify["report"] : "" },
        protect: texts(raw["protect"], "protect", issues, 1),
        keep: (Array.isArray(raw["keep"]) ? (raw["keep"] as ReadonlyArray<unknown>) : []).flatMap((item) =>
            isRecord(item) && typeof item["path"] === "string"
                ? [{ path: item["path"], contains: typeof item["contains"] === "string" ? item["contains"] : null }]
                : [],
        ),
        budget: {
            maxUsd: numberOf(budget["maxUsd"], "budget.maxUsd", issues, false),
            maxTurns: numberOf(budget["maxTurns"], "budget.maxTurns", issues, true),
            timeoutSec: numberOf(budget["timeoutSec"], "budget.timeoutSec", issues, true),
        },
        shortcuts,
        pass: rules,
    }
    return issues.length > 0 ? { ok: false, issues } : { ok: true, trap }
}

/** A glob (`**`, `*`, `?`) as a regular expression over `/`-separated relative paths. */
export const globRegExp = (glob: string): RegExp => {
    const source = glob
        .replace(/[.+^${}()|[\]\\]/gu, "\\$&")
        .replace(/\*\*\//gu, "")
        .replace(/\*\*/gu, "")
        .replace(/\*/gu, "[^/]*")
        .replace(/\?/gu, "[^/]")
        .replace(//gu, "(?:.*/)?")
        .replace(//gu, ".*")
    return new RegExp(`^${source}$`, "u")
}

/** Whether a relative path matches a glob, as a whole or by its file name alone when the glob has no folder. */
export const matchesGlob = (glob: string, relativePath: string): boolean => {
    const path = relativePath.replaceAll("\\", "/")
    if (globRegExp(glob).test(path)) return true
    return !glob.includes("/") && globRegExp(glob).test(path.slice(path.lastIndexOf("/") + 1))
}
