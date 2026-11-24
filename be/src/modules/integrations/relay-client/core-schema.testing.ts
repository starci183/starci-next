import { readFileSync } from "node:fs"
import { join } from "node:path"
import { buildSchema, coerceInputValue, GraphQLInputObjectType, parse, validate, type GraphQLSchema } from "graphql"

/** Test support: the learner CLI's GraphQL against the snapshot of the schema the core serves (`be/contracts/core/schema.graphql`). */
let held: GraphQLSchema | undefined

/** The core's schema, read once from the committed snapshot. */
export const coreSchema = (): GraphQLSchema =>
    (held ??= buildSchema(
        readFileSync(join(__dirname, "..", "..", "..", "..", "contracts", "core", "schema.graphql"), "utf8"),
    ))

/** What the core's schema says is wrong with an operation text: an unknown door, argument or field, or a missing required argument. */
export const operationErrors = (query: string): ReadonlyArray<string> =>
    validate(coreSchema(), parse(query)).map((error) => error.message)

/** The name of the input type an operation takes as its `$input` variable, or null when it takes none. */
export const inputTypeOf = (query: string): string | null => /\$input:\s*(\w+)!/u.exec(query)?.[1] ?? null

/** What the core's schema says is wrong with a value sent as the `$input` of an operation: a field it does not have or lacks, or a wrong type. */
export const inputErrors = (query: string, input: unknown): ReadonlyArray<string> => {
    const name = inputTypeOf(query)
    const type = name === null ? undefined : coreSchema().getType(name)
    if (!(type instanceof GraphQLInputObjectType)) return [`${name ?? "no input"} is not an input type of the core`]
    const errors: Array<string> = []
    coerceInputValue(input, type, (path, _value, error) => errors.push(`${path.join(".") || name}: ${error.message}`))
    return errors
}
