import { parse } from "yaml"
import { isRecord } from "@modules/platform/primitives"
import type { LessonTopicDetails, LessonTopicModule, LessonTopicSource } from "./lesson-topic.contracts"

/** What reading a `topic.yaml` gives: the topic, or the reason the file cannot be used. */
export interface LessonTopicFileResult {
    /** The topic the file describes, or null when it cannot be used. */
    readonly source: LessonTopicSource | null
    /** Why the file cannot be used, or null. */
    readonly issue: string | null
}

const stringsOf = (value: unknown): Array<string> =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []

const modulesOf = (value: unknown): Array<LessonTopicModule> =>
    Array.isArray(value)
        ? value.flatMap((item) =>
              isRecord(item) && typeof item["course"] === "string" && typeof item["index"] === "number"
                  ? [{ course: item["course"], index: item["index"] }]
                  : [],
          )
        : []

/**
 * Reads the topic metadata of `raw/essentials/<topic>/topic.yaml` (`title`, `from`, `modules`, and `details` with the page
 * description, prerequisites and related topics) so a topic is content, not code. A title and a `from` text are required.
 */
export const topicSourceOf = (text: string): LessonTopicFileResult => {
    let value: unknown
    try {
        value = parse(text)
    } catch (cause) {
        return { source: null, issue: `is not valid yaml: ${String(cause)}` }
    }
    if (!isRecord(value) || Array.isArray(value)) return { source: null, issue: "is not a mapping" }
    const title = value["title"]
    const from = value["from"]
    if (typeof title !== "string" || title.trim() === "") return { source: null, issue: "has no title" }
    if (typeof from !== "string" || from.trim() === "") return { source: null, issue: "has no from" }
    const raw = value["details"]
    const details: LessonTopicDetails | null =
        isRecord(raw) && typeof raw["description"] === "string"
            ? {
                  description: raw["description"],
                  prerequisites: stringsOf(raw["prerequisites"]),
                  related: stringsOf(raw["related"]),
              }
            : null
    return {
        source: { title, from, modules: modulesOf(value["modules"]), ...(details === null ? {} : { details }) },
        issue: null,
    }
}
