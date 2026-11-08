import { createHash } from "node:crypto"
import { access, readFile, readdir } from "node:fs/promises"
import { join, relative, sep } from "node:path"
import type { InterviewSourceBank, InterviewSourceFile } from "./interview.contracts"
import type { InterviewSourceReader } from "./interview-source.port"

const exists = (path: string): Promise<boolean> =>
    access(path).then(
        () => true,
        () => false,
    )

const foldersOf = async (directory: string): Promise<ReadonlyArray<string>> =>
    (await exists(directory))
        ? (await readdir(directory, { withFileTypes: true }))
              .filter((entry) => entry.isDirectory())
              .map((entry) => entry.name)
              .sort((a, b) => a.localeCompare(b))
        : []

const folderOf = (directory: string, bank: InterviewSourceBank): string =>
    bank.course === null
        ? join(directory, "mock-interview-eq", bank.folder)
        : join(directory, "courses", bank.course, "mock-interview", bank.folder)

const banksOf = async (directory: string): Promise<ReadonlyArray<InterviewSourceBank>> => {
    const courses = await foldersOf(join(directory, "courses"))
    const technical = await Promise.all(
        courses.map(async (course) =>
            (await foldersOf(join(directory, "courses", course, "mock-interview"))).map(
                (folder): InterviewSourceBank => ({ bankId: `${course}/${folder}`, course, folder }),
            ),
        ),
    )
    const behavioral = (await foldersOf(join(directory, "mock-interview-eq"))).map((folder): InterviewSourceBank => ({
        bankId: `eq/${folder}`,
        course: null,
        folder,
    }))
    return [...technical.flat(), ...behavioral].sort((a, b) => a.bankId.localeCompare(b.bankId))
}

const banks = async (directory: string, overlay?: string): Promise<ReadonlyArray<InterviewSourceBank>> => {
    const own = await banksOf(directory)
    if (overlay === undefined) return own
    const extra = (await banksOf(overlay)).filter((bank) => !own.some((held) => held.bankId === bank.bankId))
    return [...own, ...extra].sort((a, b) => a.bankId.localeCompare(b.bankId))
}

const filesOf = async (root: string): Promise<ReadonlyArray<InterviewSourceFile>> => {
    if (!(await exists(root))) return []
    const entries = (await readdir(root, { recursive: true, withFileTypes: true })).filter((entry) => entry.isFile())
    return Promise.all(
        entries.map(async (entry): Promise<InterviewSourceFile> => {
            const full = join(entry.parentPath, entry.name)
            const bytes = await readFile(full)
            return {
                path: relative(root, full).split(sep).join("/"),
                text: bytes.toString("utf8"),
                sha256: createHash("sha256").update(bytes).digest("hex"),
            }
        }),
    )
}

const read = async (
    directory: string,
    bank: InterviewSourceBank,
    overlay?: string,
): Promise<ReadonlyArray<InterviewSourceFile>> => {
    const own = await filesOf(folderOf(directory, bank))
    const over = overlay === undefined ? [] : await filesOf(folderOf(overlay, bank))
    const merged = new Map([...own, ...over].map((file) => [file.path, file]))
    return [...merged.values()].sort((a, b) => a.path.localeCompare(b.path))
}

/**
 * Reads interview banks from the local disk: the bank list of a data checkout, and every file of a bank with the SHA-256 of its raw
 * bytes. An overlay root laid out the same way replaces the files of the same path and adds the banks only it holds.
 */
export const interviewDirectory: InterviewSourceReader = { banks, read }
