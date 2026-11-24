import { watch, type FSWatcher } from "node:fs"
import { freemem, homedir } from "node:os"
import { dirname, join } from "node:path"
import type { LabHost } from "./lab.contracts"

/** The real machine as a lab sees it: its home, its free memory, its Node and a watcher of the lab's files. */
export const nodeLabHost = (): LabHost => ({
    home: () => homedir(),
    freeMemBytes: () => freemem(),
    nodeVersion: () => process.version,
    watch: (root, paths, onChange) => {
        const byFolder = new Map<string, Set<string>>()
        paths.forEach((path) => {
            const folder = dirname(path)
            byFolder.set(folder, (byFolder.get(folder) ?? new Set<string>()).add(path))
        })
        // A folder is watched, not the file: an editor that saves by replacing the file would end a watcher of the file itself.
        const watchers = [...byFolder].flatMap(([folder, names]): ReadonlyArray<FSWatcher> => {
            try {
                return [
                    watch(join(root, folder), (_event, name) => {
                        const changed = typeof name === "string" ? join(folder, name).replaceAll("\\", "/") : null
                        if (changed !== null && names.has(changed)) onChange(changed)
                    }),
                ]
            } catch {
                return []
            }
        })
        return { close: () => watchers.forEach((watcher) => watcher.close()) }
    },
})
