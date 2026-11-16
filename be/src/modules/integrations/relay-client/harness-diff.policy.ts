/**
 * The lines a unified diff adds, by file (`git diff --unified=0`): every file that changed has an entry, a deleted file an empty one.
 * A path the diff header quotes (spaces, non-ASCII) is read as git writes it with `core.quotepath=false`.
 */
export const addedLinesOf = (diff: string): ReadonlyMap<string, ReadonlyArray<string>> => {
    const files = new Map<string, Array<string>>()
    let current: Array<string> | null = null
    diff.split(/\r?\n/u).forEach((line) => {
        const header = /^diff --git a\/.+ b\/(.+)$/u.exec(line)
        if (header !== null) {
            current = []
            files.set(String(header[1]), current)
            return
        }
        if (current !== null && line.startsWith("+") && !line.startsWith("+++")) current.push(line.slice(1))
    })
    return files
}
