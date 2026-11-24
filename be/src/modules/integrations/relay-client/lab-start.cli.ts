import { homedir } from "node:os"
import type { CliIo } from "./relay-client.contracts"
import { refuseFolder } from "./lab.cli"
import { defaultLabRootOf, safeFolderOf } from "./lab-folder.policy"
import { clearLabFolder, writeLabFolder } from "./lab-workspace.adapter"
import { isLessonId } from "./lesson.policy"
import { listenCommand, type ListenOptions } from "./listen.cli"

/** What `starci-relay lab start` is given. */
export interface LabStartOptions extends ListenOptions {
    /** The folder to put the lab in; the default is `~/starci/<course>/<lesson>`. */
    readonly dir?: string | undefined
}

/**
 * `starci-relay lab start <course>/<lesson> [--dir <path>]`: the Setup step of a lab. With `--dir` it records that folder so the boot the
 * lesson page sends unpacks there; without it the record is cleared, so the folder the learner chose on the web (the manifest's
 * `learnerDir`) or else the default `~/starci/<course>/<lesson>` applies. It then listens for that boot and every later lab request, the
 * way `listen` does. The record is made before listening so a boot that arrives at once already uses it.
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
    const home = io.labHost?.home() ?? homedir()
    if (options.dir === undefined) {
        // The web's choice is only known once its manifest arrives, so the line names both places it may be.
        clearLabFolder(io.env, courseId, lessonId)
        const fallback = defaultLabRootOf(home, courseId, lessonId)
        io.out(`Lab ${courseId}/${lessonId} sẽ ở: thư mục bạn chọn trên web, nếu không có thì ${fallback}`)
        io.out(`The lab ${courseId}/${lessonId} goes in: the folder you chose on the web, else ${fallback}`)
    } else {
        // A typed path starts at the shell's folder, so a relative one is allowed here; a system folder is not.
        const folder = safeFolderOf(options.dir, home, cwd, "flag")
        if (folder.kind === "unsafe") {
            refuseFolder(io, folder)
            return 2
        }
        writeLabFolder(io.env, courseId, lessonId, folder.path)
        io.out(`Lab ${courseId}/${lessonId} sẽ ở: ${folder.path} (--dir)`)
        io.out(`The lab ${courseId}/${lessonId} goes in: ${folder.path} (--dir)`)
    }
    io.out("Mở trang bài học và bấm Bắt đầu; Relay đang chờ. / Open the lesson page and press Start; Relay is waiting.")
    return listenCommand(io, { autoConfirm: options.autoConfirm }, cwd)
}
