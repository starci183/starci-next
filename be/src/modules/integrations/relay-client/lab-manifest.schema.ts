import { z } from "zod"

/**
 * The schema of a lab@2 manifest (`starci-lab.yaml` at the root of a lab). A lab declares everything lesson-specific here (its
 * stack, its happy and unhappy cases, its ladder of reference fixes, its grader and the read-only views an assistant may call), so
 * the relay commands and the MCP stay generic: they read this file and nothing else about the lesson.
 *
 * The schema checks each field on its own; the rules that tie fields together (every unhappy case owns one ladder ref, an inspect id
 * a case names exists, ids are unique) live in `labManifestProblemsOf` of lab-manifest.policy.ts, so a lab author sees every
 * problem of the file at once instead of the first one.
 */

/** The schema id a lab@2 manifest declares; any other value is not this format. */
export const LAB_MANIFEST_SCHEMA_ID = "starci-next-labs/lab@2"

/** The file name of the manifest at the lab root. */
export const LAB_MANIFEST_FILE = "starci-lab.yaml"

/**
 * True for an `http` url whose host is a loopback address. The placeholders (`{orderId}`) are filled with harmless characters
 * before the url is parsed, so a template is judged by the host it will always have.
 */
export const isLoopbackUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url.replaceAll(/\{[A-Za-z][A-Za-z0-9]*\}/gu, "x"))
        return parsed.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)
    } catch {
        return false
    }
}

/** A slug id: cases, services, deps, concepts. Lowercase so it is safe in a shell, a git ref, a URL and a JUnit tag alike. */
const SLUG = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/u, "a lowercase slug (a-z, 0-9, -)")

/**
 * A git ref of the ladder (a tag or a branch name). Shell metacharacters are refused because the relay hands the ref to `git` through
 * the shell, and `..` is refused so a ref can never be read as a range.
 */
const GIT_REF = z
    .string()
    .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/u, "a git ref (letters, digits, . _ / -)")
    .refine((ref) => !ref.includes(".."), "a git ref without '..'")

/**
 * A path inside the lab, relative, with no `..` and no shell metacharacter: the relay passes it to git and reads it, so it must
 * never leave the lab folder or be read by the shell as anything but a path.
 */
const LAB_PATH = z
    .string()
    .regex(/^[A-Za-z0-9._/-]{1,200}$/u, "a relative path (letters, digits, . _ / -)")
    .refine((path) => !path.startsWith("/") && !path.split("/").includes(".."), "a path inside the lab")

/** A shell command of the lab, one line. It comes from the learner's own lab checkout, which is the learner's code anyway. */
const COMMAND = z.string().regex(/^[^\r\n\0]{1,400}$/u, "one command line of at most 400 characters")

/** Learner-facing text in both languages: Vietnamese is the product's first language, English the second. */
const TEXT = z.object({ vi: z.string().min(1), en: z.string().min(1) })

/** A chaos switch set: `{ STOCK_OUT: on, CRASH_AT: "after:payments.charge" }`; `null` or absent means no chaos. */
const CHAOS = z.record(z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/u), z.union([z.string(), z.number(), z.boolean()]))

/** One service of the lab: an own process with its own database, so the lab can fail between services the way production does. */
const SERVICE = z.object({
    id: SLUG,
    port: z.number().int().min(1).max(65535),
    db: SLUG.optional(),
    uses: z.array(SLUG).optional(),
    role: z.string().min(1),
})

/** A backing dependency the stack starts (a database, a cache) with the image the lab pins. */
const DEP = z.object({ id: SLUG, image: z.string().min(1), role: z.string().min(1) })

/** How the lab runs its tests: the cases template (`{ids}` becomes the comma-joined case ids) and the JUnit report it writes. */
const TEST = z.object({
    command: COMMAND,
    cases: COMMAND.refine((command) => command.includes("{ids}"), "a cases command that contains {ids}"),
    report: LAB_PATH,
    timeoutMs: z.number().int().positive().max(3_600_000),
})

/** A happy case: it must pass from the first rung (c0) on; it teaches the flow before anything breaks. */
const HAPPY = z.object({
    id: SLUG,
    title: TEXT,
    chaos: CHAOS.nullish(),
    invariants: z.array(SLUG).min(1),
})

/**
 * One hint level; Vietnamese is required, English is optional while the lesson is drafted in Vietnamese first. A bare string is the
 * Vietnamese text, so a lab author may write the short form.
 */
const HINT = z.union([
    z
        .string()
        .min(1)
        .transform((vi) => ({ vi })),
    z.object({ vi: z.string().min(1), en: z.string().min(1).optional() }),
])

/** The assistant's view of an unhappy case: the terms it may explain and the inspect views that help with it. */
const CASE_MCP = z.object({ explain: z.array(z.string().min(1)).default([]), inspect: z.array(SLUG).default([]) })

/** An unhappy case: red at its own rung and before, green from the rung its `ref` names on. */
const UNHAPPY = z.object({
    id: SLUG,
    title: TEXT,
    chaos: CHAOS.nullish(),
    invariants: z.array(SLUG).min(1),
    ref: GIT_REF,
    teaches: z.string().min(1),
    hints: z.array(HINT).length(3),
    mcp: CASE_MCP.default({ explain: [], inspect: [] }),
})

/** The ladder: c0 (`base`), one reference fix per unhappy case in order (`refs`), and the rung that passes everything (`main`). */
const LADDER = z.object({ base: GIT_REF, refs: z.array(GIT_REF).min(1), main: GIT_REF })

/** The hidden grader: the file, its command and the matrix of steps by faults it judges. Never read by the MCP. */
const GRADER = z.object({
    file: LAB_PATH,
    command: COMMAND,
    matrix: z.object({ steps: z.array(SLUG).min(1), faults: z.array(SLUG).min(1) }),
})

/**
 * A read-only view an assistant may call. Only loopback hosts are allowed: the view reads the learner's own running stack, and an
 * other host would let a lab file point the assistant at the network.
 */
const INSPECT = z.object({
    id: SLUG,
    url: z.string().refine((url) => isLoopbackUrl(url), "an http url on localhost, 127.0.0.1 or [::1]"),
})

/** The framework version of the lab: which repository holds it and how the learner file maps onto it. */
const FRAMEWORK = z.record(
    z.string(),
    z.object({ lab: z.string().min(1), map: z.array(z.object({ from: z.string().min(1), to: z.string().min(1) })) }),
)

/** The whole lab@2 manifest. Unknown keys are kept out of the parsed value (zod strips them), so no reader relies on one. */
export const LAB_MANIFEST = z.object({
    schema: z.literal(LAB_MANIFEST_SCHEMA_ID),
    lab: SLUG,
    /**
     * The course the lesson belongs to on StarCi: the `course:<course>/<lesson>` task id of the lab's uploads and its default folder
     * `~/starci/<course>/<lesson>`. Defaults to the lab id, which is the course id for an Essentials v2 lab.
     */
    course: SLUG.optional(),
    lessonId: SLUG,
    concept: SLUG,
    requires: z.array(SLUG).default([]),
    stack: z.object({
        language: z.string().min(1),
        runtime: z.string().min(1),
        test: z.string().min(1),
        services: z.array(SERVICE).min(1),
        deps: z.array(DEP).default([]),
    }),
    learnerFile: LAB_PATH,
    /**
     * The paths only the grader holds (`grader/`): the learner's cut leaves them out and the server keeps them hidden, writing them into
     * a clean checkout only while grading. The relay never reads them from a lab; it is declared so a lab author's list is checked.
     */
    graderOnly: z.array(LAB_PATH).optional(),
    test: TEST,
    happy: z.array(HAPPY).default([]),
    unhappy: z.array(UNHAPPY).min(1),
    ladder: LADDER,
    grader: GRADER,
    mcp: z.object({ inspect: z.array(INSPECT).default([]) }).default({ inspect: [] }),
    framework: FRAMEWORK.optional(),
})
