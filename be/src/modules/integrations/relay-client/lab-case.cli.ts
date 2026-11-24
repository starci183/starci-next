import { CASE_STASH_BRANCH_PREFIX } from "@modules/platform/relay-protocol"
import type { CheckRun, CliIo } from "./relay-client.contracts"
import { sendCaseEvent, type CaseEventSent } from "./lab-case-upload.cli"
import { caseResultEventOf, caseStatusesOf, type CasesRunFacts, type LabCaseStatus } from "./lab-case.policy"
import {
    caseOf,
    casesCommandOf,
    casesOf,
    casesThroughOf,
    rungsOf,
    type LabCase,
    type LabManifest,
} from "./lab-manifest.policy"
import { fetchDiffRung, fetchResetRung, type RungFetch } from "./lab-rung.client"
import { labWorkspaceOf, readLabReport, withScratchFiles, writeLabFile } from "./lab-workspace.adapter"

/**
 * The ladder case commands of a lab@2 lab: `case list`, `case run <id>`, `case diff <id>` and `case reset-to <id>`. They run in the
 * learner's own lab checkout, from the manifest of that checkout. `list` and `run` never wait on a server: the case loop is the learner's
 * practice on their own machine. `diff` and `reset-to` fetch ladder rungs from StarCi (lab-rung.client.ts): the checkout holds the base
 * rung alone, so the reference answers are never shipped with it. What happened (a run, a reset) is reported as a relay protocol event through the offline queue, so the lesson
 * page can follow along; the graded submission is a separate, signed flow (lab.cli.ts).
 */

/** How long one git command may take; they are all local. */
const GIT_TIMEOUT_MS = 60_000

/** Says one line in Vietnamese, then in English: Vietnamese is the product's first language. */
const tell = (say: (line: string) => void, vi: string, en: string): void => {
    say(vi)
    say(en)
}

/** Runs one git command in the lab, quietly; the caller decides what of its output the learner sees. */
const git = (io: CliIo, root: string, args: string): Promise<CheckRun> =>
    io.runCommand(`git ${args}`, root, GIT_TIMEOUT_MS, undefined, true)

/** The lab of the current folder, or the exit code after saying why there is none. */
const labOrExit = (io: CliIo, cwd: string): { readonly root: string; readonly manifest: LabManifest } | number => {
    const workspace = labWorkspaceOf(cwd)
    if (workspace.kind === "found") return workspace
    if (workspace.kind === "no-lab") {
        tell(
            io.err,
            "Không thấy starci-lab.yaml ở thư mục này hay thư mục cha. Hãy đứng trong thư mục lab.",
            "No starci-lab.yaml in this folder or a parent. Run this inside the lab folder.",
        )
        return 2
    }
    tell(
        io.err,
        `starci-lab.yaml ở ${workspace.root} chưa hợp lệ:`,
        `starci-lab.yaml in ${workspace.root} is not valid:`,
    )
    workspace.problems.forEach((problem) => io.err(`  - ${problem}`))
    return 2
}

/** The marks a status line starts with, readable without colour. */
const MARK: Readonly<Record<LabCaseStatus["state"], string>> = { green: "[xanh]", red: "[đỏ]  ", "not-run": "[chưa]" }

/** One line of a case table: mark, kind, id and Vietnamese title. */
const caseLineOf = (manifest: LabManifest, status: LabCaseStatus): string => {
    const item = caseOf(manifest, status.id)
    const kind = item?.kind === "happy" ? "vui " : "khó "
    return `${MARK[status.state]} ${kind} ${status.id}  ${item?.title.vi ?? ""}`
}

/** The status of every case from the lab's last report. */
export const lastStatusesOf = (root: string, manifest: LabManifest): ReadonlyArray<LabCaseStatus> =>
    caseStatusesOf(casesOf(manifest), readLabReport(root, manifest)?.xml ?? null)

/** `case list`: every case in teaching order with where it stood in the last run. */
export const caseListCommand = (io: CliIo, cwd: string): number => {
    const lab = labOrExit(io, cwd)
    if (typeof lab === "number") return lab
    io.out(`Lab ${lab.manifest.lab} / ${lab.manifest.lessonId}: file bạn sửa là ${lab.manifest.learnerFile}`)
    lastStatusesOf(lab.root, lab.manifest).forEach((status) => io.out(caseLineOf(lab.manifest, status)))
    return 0
}

/** What a run of cases came to: the test command's exit code and the facts a `case.result` carries. */
export interface CasesRun extends CasesRunFacts {
    readonly exitCode: number
}

/** The commit the lab checkout stands on (40 hex), or null when git does not say (no commit yet, or no repository). */
const headCommitOf = async (io: CliIo, root: string): Promise<string | null> => {
    const run = await git(io, root, "rev-parse HEAD")
    const head = run.output.trim()
    return run.exitCode === 0 && /^[0-9a-f]{40}$/u.test(head) ? head : null
}

/**
 * Runs a case and every case before it with the lab's cases command, then reads the report it wrote. `STARCI_CASES` carries the ids
 * as well as the `{ids}` of the template, so a lab may filter either way. `quiet` keeps the test output off the terminal (the MCP
 * speaks JSON-RPC on stdout and must print nothing else there).
 */
export const runCases = async (
    io: CliIo,
    root: string,
    manifest: LabManifest,
    id: string,
    quiet: boolean,
): Promise<CasesRun> => {
    const cases = casesThroughOf(manifest, id)
    const ranAt = new Date(io.now()).toISOString()
    const learnerCommit = await headCommitOf(io, root)
    const run = await io.runCommand(
        casesCommandOf(manifest, cases),
        root,
        manifest.test.timeoutMs,
        { STARCI_CASES: cases.map((item) => item.id).join(",") },
        quiet,
    )
    return {
        exitCode: run.exitCode,
        ranAt,
        durationMs: run.durationMs,
        learnerCommit,
        statuses: caseStatusesOf(cases, readLabReport(root, manifest)?.xml ?? null),
    }
}

/** Runs a case, then uploads its `case.result`; the run's answer does not wait on StarCi beyond one flush of the queue. */
export const runCaseAndReport = async (
    io: CliIo,
    root: string,
    manifest: LabManifest,
    item: LabCase,
    quiet: boolean,
): Promise<CasesRun & { readonly upload: CaseEventSent }> => {
    const run = await runCases(io, root, manifest, item.id, quiet)
    const upload = await sendCaseEvent(io, manifest, caseResultEventOf(manifest, item, run))
    return { ...run, upload }
}

/** Refuses an id that is no case of the lab, listing the ones there are. */
const unknownCase = (io: CliIo, manifest: LabManifest, id: string): number => {
    tell(io.err, `Không có case ${id}.`, `There is no case ${id}.`)
    io.err(
        `  ${casesOf(manifest)
            .map((item) => item.id)
            .join(", ")}`,
    )
    return 2
}

/** `case run <id>`: the case and every case before it; exits 0 only when the asked case is green. */
export const caseRunCommand = async (io: CliIo, cwd: string, id: string): Promise<number> => {
    const lab = labOrExit(io, cwd)
    if (typeof lab === "number") return lab
    const item = caseOf(lab.manifest, id)
    if (item === undefined) return unknownCase(io, lab.manifest, id)
    const run = await runCaseAndReport(io, lab.root, lab.manifest, item, false)
    io.out("")
    run.statuses.forEach((status) => {
        io.out(caseLineOf(lab.manifest, status))
        if (status.state === "red" && status.invariant !== null) io.out(`         bất biến hỏng: ${status.invariant}`)
    })
    const target = run.statuses.find((status) => status.id === id)
    if (target?.state === "not-run")
        tell(
            io.err,
            `Báo cáo ${lab.manifest.test.report} không có test nào gắn [case:${id}].`,
            `The report ${lab.manifest.test.report} has no test tagged [case:${id}].`,
        )
    return target?.state === "green" ? 0 : 1
}

/** Says why a rung could not be fetched: not paired, StarCi has not recorded the case green yet, or StarCi refused or was not reached. */
const rungRefused = (io: CliIo, fetched: Exclude<RungFetch, { readonly kind: "rung" }>, id: string): number => {
    if (fetched.kind === "unpaired") {
        tell(
            io.err,
            "Các bậc tham chiếu nằm trên StarCi, máy này chưa ghép cặp. Chạy: starci-relay login",
            `The reference rungs live on StarCi and this machine is not paired. ${fetched.line}`,
        )
        return 2
    }
    if (fetched.code === "COURSE_RUNG_LOCKED") {
        tell(
            io.err,
            `StarCi chưa ghi nhận ${id} xanh, nên diff chưa mở. Chạy lại khi có mạng: starci-relay case run ${id}`,
            `StarCi has not recorded ${id} green yet, so the diff is not open. Run it again while online: starci-relay case run ${id}`,
        )
        return 1
    }
    tell(
        io.err,
        fetched.status === 0 ? "Không kết nối được StarCi." : `StarCi từ chối (${fetched.code}).`,
        fetched.status === 0 ? "StarCi could not be reached." : `StarCi refused (${fetched.code}).`,
    )
    return 1
}

/**
 * `case diff <id>`: what the reference fix of the case changed in the learner file, from the rung before it to its own rung. The
 * learner's checkout holds no ladder (shipping it would hand out every answer on day 1), so both rungs come from StarCi, which serves
 * them only once it has recorded the case green for this learner. The local report is checked first so a learner who is not green yet
 * hears so at once, without a round trip; the server's record is what decides. The diff is a comparison for a learner who already
 * solved the case, never a shortcut past solving it (a learner who is stuck has `reset-to`, which says so in the history).
 */
export const caseDiffCommand = async (io: CliIo, cwd: string, id: string): Promise<number> => {
    const lab = labOrExit(io, cwd)
    if (typeof lab === "number") return lab
    const item = caseOf(lab.manifest, id)
    if (item === undefined) return unknownCase(io, lab.manifest, id)
    const rungs = rungsOf(lab.manifest, id)
    if (rungs === undefined) {
        tell(
            io.err,
            `${id} là case vui, không có bản sửa tham chiếu.`,
            `${id} is a happy case; it has no reference fix.`,
        )
        return 2
    }
    const status = lastStatusesOf(lab.root, lab.manifest).find((entry) => entry.id === id)
    if (status?.state !== "green") {
        tell(
            io.err,
            `Diff của ${id} chỉ mở khi case này đã xanh. Chạy: starci-relay case run ${id}`,
            `The diff of ${id} opens once the case is green. Run: starci-relay case run ${id}`,
        )
        return 1
    }
    const before = await fetchDiffRung(io, lab.manifest, id, rungs.from)
    if (before.kind !== "rung") return rungRefused(io, before, id)
    const after = await fetchDiffRung(io, lab.manifest, id, rungs.to)
    if (after.kind !== "rung") return rungRefused(io, after, id)
    // Compared in a scratch folder, named by rung, so the header says which rung is which and nothing lands in the checkout.
    const diff = await withScratchFiles(
        [
            { name: `${rungs.from}.ts`, content: before.rung.content },
            { name: `${rungs.to}.ts`, content: after.rung.content },
        ],
        (dir) =>
            io.runCommand(
                `git diff --no-index --no-color -- ${rungs.from}.ts ${rungs.to}.ts`,
                dir,
                GIT_TIMEOUT_MS,
                undefined,
                true,
            ),
    )
    // `git diff --no-index` exits 1 when the files differ and 0 when they are the same; anything else is a failure.
    if (diff.exitCode !== 0 && diff.exitCode !== 1) {
        io.err(diff.output.trim())
        return 1
    }
    io.out(`Bản sửa tham chiếu của ${id} (${rungs.from} → ${rungs.to}) trên ${lab.manifest.learnerFile}:`)
    io.out(diff.output.trimEnd() === "" ? "(không đổi gì trên file này)" : diff.output.trimEnd())
    return 0
}

/** The first free name for the saved branch: `cua-toi-luu-<id>`, then `-2`, `-3`… so an earlier save is never overwritten. */
const savedBranchOf = async (io: CliIo, root: string, id: string): Promise<string> => {
    const base = `${CASE_STASH_BRANCH_PREFIX}${id}`
    for (let n = 1; n < 100; n += 1) {
        const name = n === 1 ? base : `${base}-${n}`
        if ((await git(io, root, `rev-parse --verify --quiet refs/heads/${name}`)).exitCode !== 0) return name
    }
    return `${base}-${io.now()}`
}

/** Runs git steps in order and stops at the first that fails, saying what it printed. */
const steps = async (io: CliIo, root: string, list: ReadonlyArray<string>): Promise<boolean> => {
    for (const args of list) {
        const run = await git(io, root, args)
        if (run.exitCode !== 0) {
            io.err(`git ${args}`)
            io.err(run.output.trim())
            return false
        }
    }
    return true
}

/**
 * `case reset-to <id>`: for a learner who is stuck. It first keeps their own attempt on a branch `cua-toi-luu-<id>` (uncommitted
 * changes to tracked files are committed there, so nothing they typed is lost) and writes the case's reference rung over the learner
 * file on their branch and commits it. The rung comes from StarCi (always allowed; StarCi records the reset with the branch the work
 * goes to), asked before anything moves, so an offline learner's checkout is left exactly as it was.
 * The commit names the rung, so the history says honestly where the fix came from.
 */
export const caseResetToCommand = async (io: CliIo, cwd: string, id: string): Promise<number> => {
    const lab = labOrExit(io, cwd)
    if (typeof lab === "number") return lab
    if (caseOf(lab.manifest, id) === undefined) return unknownCase(io, lab.manifest, id)
    const rungs = rungsOf(lab.manifest, id)
    if (rungs === undefined) {
        tell(io.err, `${id} là case vui, không có bậc tham chiếu.`, `${id} is a happy case; it has no reference rung.`)
        return 2
    }
    const branch = await git(io, lab.root, "symbolic-ref --quiet --short HEAD")
    if (branch.exitCode !== 0) {
        tell(
            io.err,
            "Repo đang ở detached HEAD. Hãy checkout nhánh của bạn trước.",
            "The repository is on a detached HEAD. Check out your branch first.",
        )
        return 2
    }
    const current = branch.output.trim()
    const saved = await savedBranchOf(io, lab.root, id)
    // The rung is asked for FIRST: StarCi records the reset (with the branch the work is about to go to) and hands the rung, so a
    // learner who is offline or unpaired is told so with their checkout exactly as it was, and nothing is moved for a reset that
    // cannot happen.
    const fetched = await fetchResetRung(io, lab.manifest, rungs.to, {
        type: "case.reset",
        lessonId: lab.manifest.lessonId,
        caseId: id,
        stashedBranch: saved,
        at: new Date(io.now()).toISOString(),
    })
    if (fetched.kind !== "rung") {
        tell(
            io.err,
            `${lab.manifest.learnerFile} chưa đổi, repo giữ nguyên.`,
            `${lab.manifest.learnerFile} is unchanged and so is the repository.`,
        )
        return rungRefused(io, fetched, id)
    }
    const dirty = (await git(io, lab.root, "status --porcelain --untracked-files=no")).output.trim() !== ""
    // ASCII only: the message passes through cmd.exe on Windows, whose code page may not be UTF-8.
    const message = `starci: luu bai cua toi truoc khi ve bac ${id}`
    const save = dirty
        ? [`checkout -q -b ${saved}`, `commit -q -a -m "${message}"`, `checkout -q ${current}`]
        : [`branch ${saved}`]
    if (!(await steps(io, lab.root, save))) return 1
    tell(io.out, `Đã lưu bài của bạn ở nhánh ${saved}.`, `Your work is saved on the branch ${saved}.`)
    writeLabFile(lab.root, lab.manifest.learnerFile, fetched.rung.content)
    if (!(await steps(io, lab.root, [`add -- ${lab.manifest.learnerFile}`]))) return 1
    const unchanged = (await git(io, lab.root, `diff --cached --quiet -- ${lab.manifest.learnerFile}`)).exitCode === 0
    if (unchanged) {
        tell(
            io.out,
            `${lab.manifest.learnerFile} đã giống bậc ${id}; không có gì để commit.`,
            `${lab.manifest.learnerFile} already matches the rung of ${id}; nothing to commit.`,
        )
        return 0
    }
    const commit = `commit -q -m "starci: ve bac tham chieu ${id} (${rungs.to})" -- ${lab.manifest.learnerFile}`
    if (!(await steps(io, lab.root, [commit]))) return 1
    tell(
        io.out,
        `${lab.manifest.learnerFile} giờ là bản của bậc ${id}. Chạy: starci-relay case run ${id}`,
        `${lab.manifest.learnerFile} is now the rung of ${id}. Run: starci-relay case run ${id}`,
    )
    return 0
}
