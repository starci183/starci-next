// The lab files set is server-only (.starciwork/concepts/essentials.md rule 10, conventions rule 4): the c0 checkout, the NestJS version, the
// hidden grader and its cells reach a device only through the relay's signed archive routes. This check reads the committed schema the core serves
// (be/contracts/core/schema.graphql) and proves no door of the web exposes them. Exit 0 is green; any broken expectation prints itself and exits 1.
import { readFileSync } from "node:fs"
import { buildSchema, getNamedType, GraphQLInputObjectType, GraphQLInterfaceType, GraphQLObjectType } from "graphql"

const schema = buildSchema(readFileSync("be/contracts/core/schema.graphql", "utf8"))
const types = Object.values(schema.getTypeMap()).filter((type) => !type.name.startsWith("__"))

/** Every field of every object, interface and input type, with the named type it carries. */
const fields = types
    .filter(
        (type) =>
            type instanceof GraphQLObjectType ||
            type instanceof GraphQLInterfaceType ||
            type instanceof GraphQLInputObjectType,
    )
    .flatMap((type) =>
        Object.values(type.getFields()).map((field) => ({
            owner: type.name,
            name: field.name,
            type: getNamedType(field.type).name,
        })),
    )

/** The fields named like a part of the lab files record. */
const FILES_FIELDS = new Set(["source", "hidden", "framework", "cells", "rungs"])

/** The fields named `source` that belong to other products (a lesson's source, a practice answer, a CV line) and carry no lab file. */
const OTHER_SOURCE_FIELDS = [
    "LessonEssentialType.source",
    "PracticeSolveInput.source",
    "ProjectSlotType.source",
    "PublicCvLineType.source",
    "RecallItemSummaryType.source",
    "RecallItemType.source",
]

const failures = []
const expectEqual = (what, actual, expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        failures.push(`${what}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`)
    }
}

expectEqual(
    "the only lab file types are the learner's own mirrored files",
    types
        .map((type) => type.name)
        .filter((name) => /LabFiles?|LabSource|LabHidden|LabFramework|LabGrader/iu.test(name))
        .sort(),
    ["CourseLabFileType", "RelayLabFileInput", "RelayLabFilesInput"],
)

expectEqual(
    "no field named hidden, framework, cells or rungs, and no source field but those of other products",
    fields
        .filter((field) => FILES_FIELDS.has(field.name))
        .map((field) => `${field.owner}.${field.name}`)
        .sort(),
    [...OTHER_SOURCE_FIELDS].sort(),
)

expectEqual(
    "no course or relay lab type carries a list of files other than the learner's own mirrored files",
    fields
        .filter((field) => /^(Course|RelayLab)/u.test(field.owner))
        .filter((field) => /File/u.test(field.type) || field.name === "files")
        .map((field) => `${field.owner}.${field.name}: ${field.type}`)
        .sort(),
    [
        "CourseLabType.files: CourseLabFileType",
        // The last page compares the learner's file with public production repositories: each entry is a path in that public repo and a link
        // pinned to a commit sha. It carries no lab source, grader, framework or cells; the next expectation pins its shape to exactly that.
        "CourseProductionType.files: CourseProductionFileType",
        "RelayLabFilesInput.files: RelayLabFileInput",
    ],
)

const production = schema.getType("CourseProductionFileType")
expectEqual(
    "a production repository file is only a public path and a pinned link, never file text or a hash",
    production instanceof GraphQLObjectType ? Object.keys(production.getFields()).sort() : [],
    ["path", "url"],
)

// The last page also links the lesson's standard reference repository (public, `starci-next/essential-<lesson>`): one language folder
// pinned to a commit and the relay command that downloads it. Pinning its shape keeps it a link: no path, text or hash can ride on it.
const reference = schema.getType("CourseReferenceType")
expectEqual(
    "the standard reference is only a pinned public link, its verdicts and its note, never file text or a hash",
    reference instanceof GraphQLObjectType ? Object.keys(reference.getFields()).sort() : [],
    ["checked", "command", "commit", "lang", "note", "repo", "shows", "url"],
)

expectEqual(
    "no course lab type holds a file path, hash and text together except the learner's mirrored file",
    types
        .filter((type) => /^(Course|RelayLab)/u.test(type.name) && type instanceof GraphQLObjectType)
        .filter((type) => ["path", "text", "sha256"].every((name) => name in type.getFields()))
        .map((type) => type.name),
    ["CourseLabFileType"],
)

const lesson = schema.getType("CourseLessonType")
const grader = schema.getType("CourseGraderType")
if (!(lesson instanceof GraphQLObjectType) || !(grader instanceof GraphQLObjectType)) {
    failures.push("CourseLessonType or CourseGraderType is missing from the schema")
} else {
    expectEqual("the grader the lesson door gives holds only the dimensions of the matrix", Object.keys(grader.getFields()).sort(), [
        "faults",
        "steps",
    ])
    const leaked = ["hidden", "source", "framework"].filter((name) => name in lesson.getFields())
    expectEqual("the lesson door carries no lab file field", leaked, [])
}

if (failures.length > 0) {
    for (const failure of failures) console.error(`course-lab-files-server-only: ${failure}`)
    process.exit(1)
}
console.log("course-lab-files-server-only: green")
