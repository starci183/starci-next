import type {
    RelayLabChaos,
    RelayLabContract,
    RelayLabFile,
    RelayLabFramework,
    RelayLabGrading,
    RelayLabHiddenFile,
    RelayLabTest,
} from "@modules/domain/relay"
import type { CourseLabFileEntry, CourseLabFilesMeta } from "./course-lab-files-record.policy"
import type { CourseLabRecord } from "./course-lab-record.policy"

/** The project folder of the lab inside the lab folder: the lab is its own repository, so the lab folder is the project (`.`). */
export const COURSE_LAB_DIR = "."

/** The compose file of the lab, relative to its folder (the one `docker-compose.yml` at the root of the lab). */
export const COURSE_LAB_COMPOSE = "docker-compose.yml"

/** The marker of the cases template of the standard (`{ids}`, the comma-joined ids) and of the relay's one-scenario template (`{id}`). */
const CASES_MARKER = "{ids}"
const SCENARIO_MARKER = "{id}"

/** The tag a chaos key of a case is known by on the machine: the key in lowercase with hyphens (`STOCK_OUT` is `stock-out`), the only ids a manifest may carry. */
export const chaosIdOf = (key: string): string => key.toLowerCase().replaceAll("_", "-")

/** True for a key a command may name: letters, digits and underscore, so it is safe in a shell and in the JSON written below. */
const keySafe = (key: string): boolean => /^[A-Za-z][A-Za-z0-9_]{0,40}$/u.test(key)

/**
 * The command that sets one chaos switch through the lab's own HTTP endpoint (`PUT /lab/chaos` on every service of the stack): `node -e`
 * with a one-line script, in single quotes only so the same text runs under a POSIX shell and under cmd. The ports are the stack's
 * own. `on` is the value `true` (every operation); a switch that needs a value (`CRASH_AT=after:payments.charge`) is set by the case's own run.
 */
export const chaosCommandOf = (key: string, ports: ReadonlyArray<number>, turn: "on" | "off"): string =>
    `node -e "Promise.all([${ports.join(",")}].map(p=>fetch('http://localhost:'+p+'/lab/chaos',` +
    `{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({${key}:${turn === "on"}})})` +
    `.then(r=>{if(!r.ok)process.exitCode=1})))"`

/** The chaos keys the cases use, in the order of their first appearance. */
const chaosKeysOf = (record: CourseLabRecord): ReadonlyArray<string> => {
    const keys = [...record.happy, ...record.unhappy].flatMap((each) => Object.keys(each.chaos))
    return [...new Set(keys)]
}

/**
 * The chaos switches of the lab: one per key the cases use, with the label the lab declares for it (the key itself, in both languages,
 * while the lab declares none) and the commands that turn it on and off. A key no command can name is left out.
 */
export const chaosOf = (record: CourseLabRecord): ReadonlyArray<RelayLabChaos> => {
    const ports = record.stack.services.map((service) => service.port)
    const labels = new Map((record.chaos ?? []).map((each) => [each.id, each.label]))
    return chaosKeysOf(record)
        .filter(keySafe)
        .map((key) => ({
            id: chaosIdOf(key),
            on: chaosCommandOf(key, ports, "on"),
            off: chaosCommandOf(key, ports, "off"),
            label: { vi: labels.get(key)?.vi ?? key, en: labels.get(key)?.en ?? key },
        }))
}

/** The visible tests of the lab: its cases, happy first, each named by its title. */
export const testsOf = (record: CourseLabRecord): ReadonlyArray<RelayLabTest> =>
    [...record.happy, ...record.unhappy].map((each) => ({ id: each.id, name: { vi: each.title.vi, en: each.title.en } }))

/**
 * The grading of the lab: the hidden grader's command and folder, the cell ids as the scenarios and the matrix of the lab record. Null
 * when the cells and the matrix disagree (a cell outside the steps by the faults, or a cell missing), so a half-wired grader refuses to
 * run instead of grading a different grid than the one the web draws.
 */
export const gradingOf = (record: CourseLabRecord, files: CourseLabFilesMeta): RelayLabGrading | null => {
    const { steps, faults } = record.grader.matrix
    const cells = files.grader.cells
    const named = new Set(cells.map((cell) => `${cell.step}-${cell.fault}`))
    const sound =
        cells.length === steps.length * faults.length &&
        cells.every((cell) => steps.includes(cell.step) && faults.includes(cell.fault) && cell.id === `${cell.step}-${cell.fault}`) &&
        named.size === cells.length
    if (!sound) return null
    return {
        command: files.grader.command,
        into: files.grader.into,
        ...(files.grader.report === undefined ? {} : { report: files.grader.report }),
        scenarios: cells.map((cell) => cell.id),
        matrix: { steps: [...steps], faults: [...faults] },
    }
}

/**
 * The lab contract of one lesson: the facts of the `essentials-labs` record (services, learner file, matrix, cases, chaos) and of the
 * `essentials-lab-files` record (test block, grader). `courseId` names the compose project the machine brings up. Null when the cells do not
 * fit the matrix.
 */
export const contractOf = (
    record: CourseLabRecord,
    files: CourseLabFilesMeta,
    project: string,
): RelayLabContract | null => {
    const grading = gradingOf(record, files)
    if (grading === null) return null
    const frameworks: ReadonlyArray<RelayLabFramework> = files.nestjsFiles > 0 ? ["nestjs"] : []
    return {
        lab: record.lab,
        branch: files.base,
        commit: null,
        dir: COURSE_LAB_DIR,
        compose: COURSE_LAB_COMPOSE,
        project,
        services: record.stack.services.map((service) => service.id),
        test: {
            command: files.test.command,
            scenario: files.test.cases.replaceAll(CASES_MARKER, SCENARIO_MARKER),
            report: files.test.report,
            timeoutMs: files.test.timeoutMs,
            ...(files.test.install === undefined ? {} : { install: files.test.install }),
        },
        files: [record.learnerFile],
        learnerFile: record.learnerFile,
        ...(frameworks.length === 0 ? {} : { frameworks }),
        chaos: chaosOf(record),
        tests: testsOf(record),
        grading,
    }
}

/** The files of a cut as the relay reads them: path and text, no hash. */
export const cutFilesOf = (files: ReadonlyArray<CourseLabFileEntry>): ReadonlyArray<RelayLabFile> =>
    files.map((file) => ({ path: file.path, text: file.text }))

/** The hidden grading files as the relay reads them: path (already under the grader folder), hash and text. */
export const hiddenFilesOf = (files: ReadonlyArray<CourseLabFileEntry>): ReadonlyArray<RelayLabHiddenFile> =>
    files.map((file) => ({ path: file.path, sha256: file.sha256, text: file.text }))
