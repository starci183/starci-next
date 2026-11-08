import { isRecord } from "@modules/platform/primitives"

/** A closed set of text values. */
export interface OneOfShape {
    /** The allowed values. */
    readonly oneOf: ReadonlyArray<string>
}

/** A list whose every item has one shape. */
export interface ListShape {
    /** The shape of each item. */
    readonly items: LessonShape
}

/** An object with required and optional members; other members are tolerated and ignored. */
export interface ObjectShape {
    /** The members that must be present. */
    readonly required: Readonly<Record<string, LessonShape>>
    /** The members that may be absent. */
    readonly optional?: Readonly<Record<string, LessonShape>>
}

/** What a decoded value of the content format must look like. */
export type LessonShape = "string" | "boolean" | "integer" | "positive" | OneOfShape | ListShape | ObjectShape

/** One mismatch between a value and its shape. */
export interface ShapeIssue {
    /** The field path inside the checked value. */
    readonly field: string
    /** What is wrong. */
    readonly message: string
}

const issue = (field: string, message: string): Array<ShapeIssue> => [{ field, message }]

const scalarIssues = (value: unknown, shape: "string" | "boolean" | "integer" | "positive", field: string) => {
    if (shape === "string") return typeof value === "string" && value !== "" ? [] : issue(field, "expected a text")
    if (shape === "boolean") return typeof value === "boolean" ? [] : issue(field, "expected true or false")
    const least = shape === "positive" ? 1 : 0
    return Number.isInteger(value) && Number(value) >= least
        ? []
        : issue(field, `expected a whole number from ${least}`)
}

const objectIssues = (value: unknown, shape: ObjectShape, field: string): Array<ShapeIssue> => {
    if (!isRecord(value)) return issue(field, "expected an object")
    const at = (key: string): string => (field === "" ? key : `${field}.${key}`)
    const required = Object.entries(shape.required).flatMap(([key, member]) =>
        Object.hasOwn(value, key) ? shapeIssues(value[key], member, at(key)) : issue(at(key), "is missing"),
    )
    const optional = Object.entries(shape.optional ?? {}).flatMap(([key, member]) =>
        Object.hasOwn(value, key) ? shapeIssues(value[key], member, at(key)) : [],
    )
    return [...required, ...optional]
}

/** Lists every place where `value` departs from `shape`; an empty list means it fits. */
export const shapeIssues = (value: unknown, shape: LessonShape, field = ""): Array<ShapeIssue> => {
    if (typeof shape === "string") return scalarIssues(value, shape, field)
    if ("oneOf" in shape) {
        return typeof value === "string" && shape.oneOf.includes(value)
            ? []
            : issue(field, `expected one of ${shape.oneOf.join(", ")}`)
    }
    if ("items" in shape) {
        return Array.isArray(value)
            ? value.flatMap((item, index) => shapeIssues(item, shape.items, `${field}[${index}]`))
            : issue(field, "expected a list")
    }
    return objectIssues(value, shape, field)
}
