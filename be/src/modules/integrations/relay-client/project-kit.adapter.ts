import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

/** The files a kit copy wrote and the ones it left alone because they already exist. */
export interface KitCopy {
    /** The paths written, relative to the project folder. */
    readonly written: ReadonlyArray<string>
    /** The paths kept as they were, relative to the project folder. */
    readonly kept: ReadonlyArray<string>
}

/** The files under a folder, relative to it, in a stable order. */
const filesUnder = (root: string, relative = ""): ReadonlyArray<string> =>
    readdirSync(join(root, relative))
        .sort((a, b) => a.localeCompare(b))
        .flatMap((name) => {
            const path = relative === "" ? name : `${relative}/${name}`
            return statSync(join(root, path)).isDirectory() ? filesUnder(root, path) : [path]
        })

/** The text of a file of the project folder, or null when it is missing. */
export const readProjectFile = (cwd: string, path: string): string | null => {
    const full = join(cwd, path)
    return existsSync(full) ? readFileSync(full, "utf8") : null
}

/** Replaces the text of a file of the project folder, its folders created if needed. */
export const writeProjectFile = (cwd: string, path: string, text: string): void => {
    const full = join(cwd, path)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, text, "utf8")
}

/** Makes the folder a project file will be written into (the test command writes the JUnit report there). */
export const ensureFolderOf = (cwd: string, path: string): void => {
    mkdirSync(dirname(join(cwd, path)), { recursive: true })
}

/** True when a folder exists. */
export const folderExists = (path: string): boolean => existsSync(path) && statSync(path).isDirectory()

/** Copies one file of the kit into the project folder; an existing file stays unless `force` says to replace it. */
const copyOne = (from: string, cwd: string, path: string, force: boolean): "written" | "kept" => {
    const target = join(cwd, path)
    if (existsSync(target) && !force) return "kept"
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(from, target)
    return "written"
}

/** Copies the kit's `starci/` folder and one CI template into the project folder. */
export const copyKit = (kitDir: string, cwd: string, ciFile: string, force: boolean): KitCopy => {
    const starci = filesUnder(join(kitDir, "starci")).map((file) => ({
        from: join(kitDir, "starci", file),
        path: `starci/${file}`,
    }))
    const workflow = { from: join(kitDir, "ci", ciFile), path: ".github/workflows/starci.yml" }
    const copied = [...starci, workflow].map((file) => ({ path: file.path, result: copyOne(file.from, cwd, file.path, force) }))
    return {
        written: copied.filter((file) => file.result === "written").map((file) => file.path),
        kept: copied.filter((file) => file.result === "kept").map((file) => file.path),
    }
}
