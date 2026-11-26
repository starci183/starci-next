import type { CourseLessonRecord } from "./lesson"

/** The architecture of a lab as Mermaid text. */
export type CourseDiagram = {
    readonly source: string
}

/**
 * The words a drawing carries that the record does not: the node of the caller from outside and the frame that holds the lab.
 *
 * No node carries the learner file's name: the intro page is page 1, and under the REF rule pages 1 to 4 never name the lesson's term,
 * which a learner file such as `checkout.ts` does. The learner's service carries the Grammar's neutral "edit" mark instead (`class X edit`: an
 * accent frame and a pencil chip, no file name); a Grammar without the mark reads the class as nothing and draws the node plain.
 */
export type CourseDiagramWords = {
    /** The node that stands for whoever calls the first service from outside. */
    readonly entry: string
    /** The title of the frame every service, database and dependency of the lab stands in: where they run. */
    readonly frame: string
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

/**
 * The icon names the Grammar's drawing may know, by the word a dependency's id or image carries. A name it does not know draws nothing, so a
 * dependency absent here stays a plain labelled node.
 */
const DEP_ICONS: ReadonlyArray<readonly [RegExp, string]> = [
    [/postgres/iu, "postgresql"],
    [/redis/iu, "redis"],
    [/rabbit/iu, "rabbitmq"],
    [/kafka/iu, "kafka"],
    [/mongo/iu, "mongodb"],
    [/maria/iu, "mariadb"],
    [/mysql/iu, "mysql"],
]

/** A dependency as the drawing reads it. */
type DepLike = { readonly id: string; readonly image: string; readonly icon?: string | null }

/** The icon name of a dependency: the one the record names, else the one its id or image suggests, or undefined when none is known. */
const depIconOf = (dep: DepLike): string | undefined => {
    if (dep.icon !== undefined && dep.icon !== null && dep.icon !== "") return dep.icon
    return DEP_ICONS.find(([pattern]) => pattern.test(dep.id) || pattern.test(dep.image))?.[1]
}

/** The icon name of the engine of a service's own database: the first database dependency the stack declares (a service's database is a schema of it). */
const dbIconOf = (lesson: CourseLessonRecord): string | undefined => {
    const engines = new Set(["postgresql", "mysql", "mariadb", "mongodb"])
    return lesson.stack.deps.map((dep) => depIconOf(dep)).find((icon) => icon !== undefined && engines.has(icon))
}

/** The icon name of a service: the one the record names, else Node.js for a Node runtime. */
const serviceIconOf = (
    lesson: CourseLessonRecord,
    service: CourseLessonRecord["stack"]["services"][number],
): string | undefined => {
    if (service.icon !== null && service.icon !== "") return service.icon
    return /node/iu.test(lesson.stack.runtime) ? "nodejs" : undefined
}

/** The nodes and edges of one service: its box, its own database and the dependencies it uses. */
const linesOfService = (service: CourseLessonRecord["stack"]["services"][number]): ReadonlyArray<string> => {
    const node = idOf("s", service.id)
    const label = textOf(`${service.id} :${service.port}`)
    const own = service.db === null ? [] : [`${idOf("d", service.db)}[("${textOf(service.db)}")]`]
    const links = service.db === null ? [] : [`${node} -.- ${idOf("d", service.db)}`]
    const uses = service.uses.map((dep) => `${node} -.-> ${idOf("p", dep)}`)
    return [`${node}["${label}"]`, ...own, ...links, ...uses]
}

/** The longest words a call's pill takes from the callee's role before it keeps the number alone. */
const CALL_WORDS = 3

/**
 * The words of the caller's n-th call, numbered in the order the record lists the services (the order the learner's code calls them): the number,
 * then the first clause of the callee's role when it is three words or fewer (`Trừ tiền` gives `1 trừ tiền`), lower-cased the way a step reads
 * mid-sentence; a longer role leaves the number alone.
 */
export const callWordsOf = (index: number, role: string): string => {
    const clause = (role.split(/[.;,:(—–]/u)[0] ?? "").trim()
    const words = clause.split(/\s+/u).filter((word) => word !== "")
    if (words.length === 0 || words.length > CALL_WORDS) return String(index)
    const phrase = words.join(" ")
    return `${String(index)} ${phrase.charAt(0).toLocaleLowerCase("vi") + phrase.slice(1)}`
}

/** One `X@{ icon: "name" }` line per node whose technology is known: the drawing puts the logo before the node's words. */
const iconLinesOf = (lesson: CourseLessonRecord): ReadonlyArray<string> => {
    const dbIcon = dbIconOf(lesson)
    const lines: string[] = lesson.stack.host === "docker" ? [`frame@{ icon: "docker" }`] : []
    for (const service of lesson.stack.services) {
        const serviceIcon = serviceIconOf(lesson, service)
        if (serviceIcon !== undefined) lines.push(`${idOf("s", service.id)}@{ icon: "${serviceIcon}" }`)
        if (service.db !== null && dbIcon !== undefined) lines.push(`${idOf("d", service.db)}@{ icon: "${dbIcon}" }`)
    }
    const used = new Set(lesson.stack.services.flatMap((service) => service.uses))
    for (const dep of lesson.stack.deps.filter((each) => used.has(each.id))) {
        const icon = depIconOf(dep)
        if (icon !== undefined) lines.push(`${idOf("p", dep.id)}@{ icon: "${icon}" }`)
    }
    return lines
}

/**
 * The architecture of the lab drawn from its record: whoever calls from outside reaches the service that holds the learner's file, that
 * service calls the others, each service stands over its own database and the dependencies it uses, and all of them stand in one frame
 * that says they run on the learner's machine (`stack.host: docker` gives the frame its logo). Each node names its technology with `X@{ icon: "express" }`, the name of the logo the Grammar
 * draws before its words; a name the Grammar has no logo for draws nothing, so the drawing reads the same without it. The service of the
 * learner's file is the one the outside caller reaches; its node carries no file name (see `CourseDiagramWords`) and no colour: the accent
 * is for the one primary command of a page.
 */
export const diagramOf = (lesson: CourseLessonRecord, words: CourseDiagramWords, locale = "vi"): CourseDiagram => {
    const { services, deps } = lesson.stack
    const caller = learnerServiceOf(lesson)
    const inner: string[] = []
    for (const service of services) {
        inner.push(...linesOfService(service))
    }
    const used = new Set(services.flatMap((service) => service.uses))
    for (const dep of deps.filter((each) => used.has(each.id))) {
        inner.push(`${idOf("p", dep.id)}(["${textOf(dep.id)}"])`)
    }
    if (caller !== undefined) {
        // Each call numbered in the order the record lists the services, with the callee's role in a few words: the steps the learner's code takes.
        services
            .filter((service) => service.id !== caller.id)
            .forEach((service, index) => {
                const role = locale === "en" ? (service.role.en ?? service.role.vi) : service.role.vi
                inner.push(`${idOf("s", caller.id)} -->|"${textOf(callWordsOf(index + 1, role))}"| ${idOf("s", service.id)}`)
            })
    }
    const lines = [
        "flowchart LR",
        `    entry(["${textOf(words.entry)}"])`,
        `    subgraph frame["${textOf(words.frame)}"]`,
        ...inner.map((each) => `        ${each}`),
        "    end",
        ...(caller === undefined ? [] : [`    entry --> ${idOf("s", caller.id)}`]),
        ...iconLinesOf(lesson).map((each) => `    ${each}`),
        ...(caller === undefined ? [] : [`    class ${idOf("s", caller.id)} edit`]),
    ]
    return { source: lines.join("\n") }
}
