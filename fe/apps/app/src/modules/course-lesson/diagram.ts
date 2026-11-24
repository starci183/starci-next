import type { CourseLessonRecord } from "./lesson"

/** The architecture of a lab as Mermaid text with the tone of each node. */
export type CourseDiagram = {
    readonly source: string
    readonly tones: Readonly<Record<string, "accent">>
}

/** The words a drawing carries that the record does not: the node of the caller from outside and the mark of the file the learner edits. */
export type CourseDiagramWords = {
    /** The node that stands for whoever calls the first service from outside. */
    readonly entry: string
    /** What is written on the node of the learner's file: the file's own name, or the term of the lesson's concept once it is named. */
    readonly mark: string
}

/** A Mermaid node id made of the letters, digits and underscores of an id of the record. */
const idOf = (prefix: string, id: string): string => `${prefix}_${id.replaceAll(/\W/g, "_")}`

/** Text safe inside a double-quoted Mermaid label: no quote, bracket, brace, bar or angle bracket and one line. */
const textOf = (text: string): string =>
    text
        .replaceAll(/["[\](){}|<>\r\n]/g, " ")
        .replaceAll(/\s+/g, " ")
        .trim()

/** The service that holds the learner's file: the one whose id is a folder of its path, else the first service. */
export const learnerServiceOf = (
    lesson: CourseLessonRecord,
): CourseLessonRecord["stack"]["services"][number] | undefined => {
    const folders = new Set(lesson.learnerFile.split("/"))
    return lesson.stack.services.find((each) => folders.has(each.id)) ?? lesson.stack.services[0]
}

/** The file name of a path. */
export const fileNameOf = (path: string): string => path.slice(path.lastIndexOf("/") + 1)

/** The nodes and edges of one service: its box, its own database and the dependencies it uses. */
const linesOfService = (
    service: CourseLessonRecord["stack"]["services"][number],
    mark: string | undefined,
): ReadonlyArray<string> => {
    const node = idOf("s", service.id)
    const label = textOf(
        mark === undefined ? `${service.id} :${service.port}` : `${service.id} :${service.port} ${mark}`,
    )
    const own = service.db === null ? [] : [`${idOf("d", service.db)}[("${textOf(service.db)}")]`]
    const links = service.db === null ? [] : [`${node} -.- ${idOf("d", service.db)}`]
    const uses = service.uses.map((dep) => `${node} -.-> ${idOf("p", dep)}`)
    return [`${node}["${label}"]`, ...own, ...links, ...uses]
}

/**
 * The architecture of the lab drawn from its record: whoever calls from outside reaches the service that holds the learner's file, that
 * service calls the others, each service stands over its own database and the dependencies it uses (a dependency no service uses stays
 * in the list beside the drawing); the node of the learner's file takes
 * the accent tone and carries `words.mark`.
 */
export const diagramOf = (lesson: CourseLessonRecord, words: CourseDiagramWords): CourseDiagram => {
    const { services, deps } = lesson.stack
    const caller = learnerServiceOf(lesson)
    const lines: string[] = ["flowchart LR", `    entry(["${textOf(words.entry)}"])`]
    for (const service of services) {
        lines.push(
            ...linesOfService(service, service.id === caller?.id ? words.mark : undefined).map((each) => `    ${each}`),
        )
    }
    const used = new Set(services.flatMap((service) => service.uses))
    for (const dep of deps.filter((each) => used.has(each.id))) {
        lines.push(`    ${idOf("p", dep.id)}(["${textOf(dep.id)}"])`)
    }
    if (caller !== undefined) {
        lines.push(`    entry --> ${idOf("s", caller.id)}`)
        for (const service of services) {
            if (service.id !== caller.id) lines.push(`    ${idOf("s", caller.id)} --> ${idOf("s", service.id)}`)
        }
    }
    return { source: lines.join("\n"), tones: caller === undefined ? {} : { [idOf("s", caller.id)]: "accent" } }
}
