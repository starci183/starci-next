import type { CliIo } from "./relay-client.contracts"
import { servicePlanOf, type ServiceHost } from "./service.policy"

/** Whether the start-at-login file of this user exists. */
export const isServiceInstalled = (host: ServiceHost): boolean => host.exists(servicePlanOf(host).path)

/** Runs the commands in order and says whether the last one worked. */
const runAll = async (host: ServiceHost, commands: ReadonlyArray<string>): Promise<boolean> => {
    let ok = true
    for (const command of commands) ok = (await host.shell(command)) === 0
    return ok
}

/** Makes the relay start by itself when this user logs in, with no admin right, and starts it now. */
export const installServiceCommand = async (io: CliIo, host: ServiceHost, yes: boolean): Promise<number> => {
    const plan = servicePlanOf(host)
    const question =
        "Relay sẽ tự chạy mỗi khi bạn đăng nhập máy và chạy yêu cầu đã ký của StarCi mà không hỏi lại từng lần. Tiếp tục?"
    if (!yes && !(await io.confirm(question))) {
        io.out("Chưa cài. Chạy lại với --yes nếu bạn muốn bỏ qua câu hỏi này.")
        return 0
    }
    await runAll(host, plan.stop)
    host.write(plan.path, plan.content)
    if (!(await runAll(host, plan.start))) {
        io.err(`Đã ghi ${plan.path} nhưng chưa khởi động được ngay. Đăng nhập lại máy là Relay tự chạy.`)
        return 1
    }
    io.out(`Đã bật Relay tự chạy khi đăng nhập (${plan.where}). Tắt bằng: starci-relay uninstall-service`)
    return 0
}

/** Stops the relay and removes its start-at-login file. */
export const uninstallServiceCommand = async (io: CliIo, host: ServiceHost): Promise<number> => {
    const plan = servicePlanOf(host)
    if (!host.exists(plan.path)) {
        io.out("Relay chưa được bật tự chạy, không có gì để gỡ.")
        return 0
    }
    await runAll(host, plan.stop)
    host.remove(plan.path)
    if (host.platform === "linux") await host.shell("systemctl --user daemon-reload")
    io.out("Đã tắt Relay tự chạy khi đăng nhập.")
    return 0
}
