import {
    GraphQLError,
    Kind,
    type ASTVisitor,
    type FragmentDefinitionNode,
    type OperationDefinitionNode,
    type SelectionSetNode,
    type ValidationContext,
} from "graphql"

/** The bounds one operation is held to. */
export interface OperationLimits {
    /** The deepest field nesting the operation may reach, fragments resolved. */
    readonly maxDepth: number
    /** The most fields the operation may select in all, aliases and fragment spreads counted at every use. */
    readonly maxFields: number
    /** The most root fields a mutation may select: each one is a write (a purchase, a provider link). */
    readonly maxRootMutations: number
}

/** What one walk of an operation measured. */
interface Measure {
    /** The deepest field nesting reached. */
    readonly depth: number
    /** The fields selected, counted at every use. */
    readonly fields: number
}

/** The fragments of a document by name. */
type Fragments = ReadonlyMap<string, FragmentDefinitionNode>

/**
 * Measures a selection set with every fragment spread resolved where it is used, so a chain of fragments nests and counts
 * exactly as the same fields written inline. A spread already on the current path (a cycle, which the standard
 * `NoFragmentCycles` rule refuses) or a fragment that does not exist adds nothing. The walk stops early once `bound` is
 * passed, so a hostile document costs no more than the limit to measure.
 */
const measure = (
    set: SelectionSetNode,
    fragments: Fragments,
    path: ReadonlySet<string>,
    level: number,
    bound: number,
): Measure => {
    let depth = level
    let fields = 0
    for (const selection of set.selections) {
        if (fields > bound) break
        if (selection.kind === Kind.FIELD) {
            fields += 1
            if (selection.selectionSet === undefined) continue
            const inner = measure(selection.selectionSet, fragments, path, level + 1, bound - fields)
            depth = Math.max(depth, inner.depth)
            fields += inner.fields
            continue
        }
        if (selection.kind === Kind.INLINE_FRAGMENT) {
            const inner = measure(selection.selectionSet, fragments, path, level, bound - fields)
            depth = Math.max(depth, inner.depth)
            fields += inner.fields
            continue
        }
        const name = selection.name.value
        const fragment = fragments.get(name)
        if (fragment === undefined || path.has(name)) continue
        const inner = measure(fragment.selectionSet, fragments, new Set([...path, name]), level, bound - fields)
        depth = Math.max(depth, inner.depth)
        fields += inner.fields
    }
    return { depth, fields }
}

/** The number of root fields a mutation selects, inline and through fragments at the root. */
const rootFieldsOf = (set: SelectionSetNode, fragments: Fragments, path: ReadonlySet<string>): number =>
    set.selections.reduce((count, selection) => {
        if (selection.kind === Kind.FIELD) return count + 1
        if (selection.kind === Kind.INLINE_FRAGMENT)
            return count + rootFieldsOf(selection.selectionSet, fragments, path)
        const fragment = fragments.get(selection.name.value)
        if (fragment === undefined || path.has(selection.name.value)) return count
        return count + rootFieldsOf(fragment.selectionSet, fragments, new Set([...path, selection.name.value]))
    }, 0)

/** Reports each bound one operation passes. */
const checkOperation = (
    context: ValidationContext,
    operation: OperationDefinitionNode,
    fragments: Fragments,
    limits: OperationLimits,
): void => {
    const { depth, fields } = measure(operation.selectionSet, fragments, new Set(), 1, limits.maxFields)
    if (depth > limits.maxDepth) context.reportError(new GraphQLError(`Selection depth exceeds ${limits.maxDepth}.`))
    if (fields > limits.maxFields) context.reportError(new GraphQLError(`Selected fields exceed ${limits.maxFields}.`))
    if (
        operation.operation === "mutation" &&
        rootFieldsOf(operation.selectionSet, fragments, new Set()) > limits.maxRootMutations
    )
        context.reportError(new GraphQLError(`A mutation may select at most ${limits.maxRootMutations} root field.`))
}

/**
 * A validation rule that holds every operation of a document to its limits, with fragments resolved where they are spread:
 * the field nesting depth (a top-level field is depth 1), the total of selected fields (each alias and each use of a
 * fragment counts), and the root fields of a mutation.
 */
export const operationLimitsRule =
    (limits: OperationLimits) =>
    (context: ValidationContext): ASTVisitor => {
        const document = context.getDocument()
        const fragments: Fragments = new Map(
            document.definitions
                .filter(
                    (definition): definition is FragmentDefinitionNode => definition.kind === Kind.FRAGMENT_DEFINITION,
                )
                .map((definition) => [definition.name.value, definition]),
        )
        return {
            OperationDefinition: (operation) => {
                checkOperation(context, operation, fragments, limits)
            },
        }
    }
