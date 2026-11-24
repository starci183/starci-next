import { homedir } from "node:os"
import { isAbsolute, resolve } from "node:path"
import type { CliIo } from "./relay-client.contracts"
import { defaultLabRootOf } from "./lab.cli"
import { writeLabFolder } from "./lab-workspace.adapter"
import { isLessonId } from "./lesson.policy"
import { listenCommand, type ListenOptions } from "./listen.cli"

/** What `starci-relay lab start` is given. */
export interface LabStartOptions extends ListenOptions {
    /** The folder to put the lab in; the default is `~/starci/<course>/<lesson>`. */
    readonly dir?: string | undefined
}

/** A `--dir` as the learner typed it, made absolute: `~` is their home (cmd.exe does not expand it), a relative path is from here. */
const folderOf = (dir: string, cwd: string): string => {
    const expanded = dir === "~" || dir.startsWith("~/") || dir.startsWith("~\\") ? `${homedir()}${dir.slice(1)}` : dir
    return isAbsolute(expanded) ? resolve(expanded) : resolve(cwd, expanded)
}

/**
 * `starci-relay lab start <course>/<lesson> [--dir <path>]`: the Setup step of a lab. It records the folder the learner chose (or the
 * default `~/starci/<course>/<lesson>`) so the boot the lesson page sends unpacks there, then listens for that boot and every later
 * lab request, the way `listen` does. The folder is recorded before listening so a boot that arrives at once already uses it.
 */
export const labStartCommand = async (
    io: CliIo,
    target: string,
    options: LabStartOptions,
    cwd: string,
): Promise<number> => {
    const [courseId = "", lessonId = "", ...rest] = target.split("/")
    if (!isLessonId(courseId) || !isLessonId(lessonId) || rest.length > 0) {
        io.err("Viết lab theo dạng <khoá>/<bài>, ví dụ: starci-relay lab start shop-giay/saga-compensation")
        io.err("Name the lab as <course>/<lesson>, e.g. starci-relay lab start shop-giay/saga-compensation")
        return 2
    }
    const folder =
        options.dir === undefined ? defaultLabRootOf(homedir(), courseId, lessonId) : folderOf(options.dir, cwd)
    writeLabFolder(io.env, courseId, lessonId, folder)
    io.out(`Lab ${courseId}/${lessonId} sẽ ở: ${folder}`)
    io.out(`The lab ${courseId}/${lessonId} goes in: ${folder}`)
    io.out("Mở trang bài học và bấm Bắt đầu; Relay đang chờ. / Open the lesson page and press Start; Relay is waiting.")
    return listenCommand(io, { autoConfirm: options.autoConfirm }, cwd)
}
