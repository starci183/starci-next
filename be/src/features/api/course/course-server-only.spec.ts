import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
    buildSchema,
    getNamedType,
    GraphQLInputObjectType,
    GraphQLInterfaceType,
    GraphQLObjectType,
    type GraphQLNamedType,
    type GraphQLSchema,
} from "graphql"

/**
 * The lab files set (`essentials-lab-files`) is server-only (conventions rule 4: grading data never leaves early): the c0 checkout, the NestJS
 * version, the hidden grader and its cells reach a device only through the relay's signed archive routes. This spec reads the committed schema
 * the core serves and proves no door of the web exposes them.
 */
const schema = (): GraphQLSchema =>
    buildSchema(readFileSync(join(__dirname, "..", "..", "..", "..", "contracts", "core", "schema.graphql"), "utf8"))

interface FieldRef {
    readonly owner: string
    readonly name: string
    readonly type: string
}

/** Every field of every object, interface and input type of the schema, with the named type it carries. */
const fieldsOf = (held: GraphQLSchema): ReadonlyArray<FieldRef> =>
    Object.values(held.getTypeMap())
        .filter(
            (type: GraphQLNamedType) =>
                !type.name.startsWith("__") &&
                (type instanceof GraphQLObjectType ||
                    type instanceof GraphQLInterfaceType ||
                    type instanceof GraphQLInputObjectType),
        )
        .flatMap((type) =>
            Object.values((type as GraphQLObjectType).getFields()).map((field) => ({
                owner: type.name,
                name: field.name,
                type: getNamedType(field.type).name,
            })),
        )

/** The fields named like a part of the lab files record. */
const FILES_FIELDS = new Set(["source", "hidden", "framework", "cells", "rungs"])

/** The fields of the schema named `source` that belong to other products (a lesson's source, a practice answer, a CV line) and carry no lab file. */
const OTHER_SOURCE_FIELDS = [
    "LessonEssentialType.source",
    "PracticeSolveInput.source",
    "ProjectSlotType.source",
    "PublicCvLineType.source",
    "RecallItemSummaryType.source",
    "RecallItemType.source",
]

describe("the lab files set is server-only", () => {
    it("has no type of its own in the schema: the only lab file types are the learner's own mirrored files, read back and uploaded", () => {
        const names = Object.keys(schema().getTypeMap())

        expect(names.filter((name) => /LabFiles?|LabSource|LabHidden|LabFramework|LabGrader/iu.test(name)).sort()).toEqual([
            "CourseLabFileType",
            "RelayLabFileInput",
            "RelayLabFilesInput",
        ])
    })

    it("has no field named hidden, framework, cells or rungs on any type, and no source field but those of other products", () => {
        const named = fieldsOf(schema()).filter((field) => FILES_FIELDS.has(field.name))

        expect(named.map((field) => `${field.owner}.${field.name}`).sort()).toEqual([...OTHER_SOURCE_FIELDS].sort())
    })

    it("has no course or relay lab type that carries a list of files other than the learner's own mirrored files, out and in", () => {
        const labTypes = fieldsOf(schema()).filter((field) => /^(Course|RelayLab)/u.test(field.owner))
        const fileFields = labTypes.filter((field) => /File/u.test(field.type) || field.name === "files")

        expect(fileFields.map((field) => `${field.owner}.${field.name}: ${field.type}`).sort()).toEqual([
            "CourseLabType.files: CourseLabFileType",
            "RelayLabFilesInput.files: RelayLabFileInput",
        ])
    })

    it("holds no file path, hash and text together on any course lab type except the learner's mirrored file", () => {
        const held = schema()
        const carriers = Object.values(held.getTypeMap()).filter((type) => {
            if (!/^(Course|RelayLab)/u.test(type.name) || !(type instanceof GraphQLObjectType)) return false
            const names = Object.keys(type.getFields())
            return names.includes("path") && names.includes("text") && names.includes("sha256")
        })

        expect(carriers.map((type) => type.name)).toEqual(["CourseLabFileType"])
    })

    it("does not give the lesson door the grader's cells or its files: only the dimensions of the matrix", () => {
        const lesson = schema().getType("CourseLessonType")
        const grader = schema().getType("CourseGraderType")
        if (!(lesson instanceof GraphQLObjectType) || !(grader instanceof GraphQLObjectType)) throw new Error("types missing")

        expect(Object.keys(grader.getFields()).sort()).toEqual(["faults", "steps"])
        expect(Object.keys(lesson.getFields())).not.toEqual(expect.arrayContaining(["hidden", "source", "framework"]))
    })
})
