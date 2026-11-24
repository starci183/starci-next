/** The label the launchd agent carries. */
export const SERVICE_LABEL = "vn.starci.relay"

/** The systemd user unit name. */
export const SYSTEMD_UNIT = "starci-relay.service"

/** The Windows Startup script name. */
export const WINDOWS_STARTUP_FILE = "StarCi Relay.vbs"

/** The places and programs a per-user auto-start of the relay is built from. */
export interface ServiceHost {
    /** The Node platform: win32, darwin or linux. */
    readonly platform: string
    /** The home folder of this user. */
    readonly home: string
    /** `%APPDATA%` on Windows. */
    readonly appData: string | undefined
    /** The user id on macOS and Linux (launchctl needs it). */
    readonly uid: number | undefined
    /** The Node program running this CLI. */
    readonly nodePath: string
    /** The bundled script of this CLI. */
    readonly scriptPath: string
    /** The settings the service must keep (`STARCI_NEXT_HOME`, `STARCI_NEXT_URL`) when this shell set them. */
    readonly env: Readonly<Record<string, string>>
    /** Writes a file, its folder created. */
    readonly write: (path: string, content: string) => void
    /** Removes a file; nothing happens when it is missing. */
    readonly remove: (path: string) => void
    /** Whether a file exists. */
    readonly exists: (path: string) => boolean
    /** Runs one command line in the user's shell and answers its exit code. */
    readonly shell: (command: string) => Promise<number>
}

/** How one operating system starts the relay for this user at login, with no admin right. */
export interface ServicePlan {
    /** Where the start-up file lives. */
    readonly path: string
    /** What the file holds. */
    readonly content: string
    /** Commands that start it now, run after the file is written. */
    readonly start: ReadonlyArray<string>
    /** Commands that stop it, run before the file is written or removed (their failure is fine: it may not be running). */
    readonly stop: ReadonlyArray<string>
    /** What the learner is told about where it runs. */
    readonly where: string
}

/** The words after `node script` that make the relay listen without a terminal. */
const LISTEN_ARGS = "listen --auto-confirm"

/** A path of a platform, its parts joined with that platform's separator. */
const joinPath = (platform: string, ...parts: ReadonlyArray<string>): string =>
    parts.join(platform === "win32" ? "\\" : "/")

const escapeXml = (text: string): string =>
    text.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;")

const envEntries = (host: ServiceHost): Array<[string, string]> => Object.entries(host.env)

/** A Windows Startup script that runs the relay with no window; `""` is a quote inside a VBScript string. */
const windowsContent = (host: ServiceHost): string => {
    const quote = (text: string): string => text.replace(/"/gu, '""')
    const line = `""${quote(host.nodePath)}"" ""${quote(host.scriptPath)}"" ${LISTEN_ARGS}`
    const sets = envEntries(host).map(([key, value]) => `shell.Environment("Process")("${key}") = "${quote(value)}"`)
    return [
        "' StarCi Relay: starts the relay for this user at login. Remove it with: starci-relay uninstall-service",
        'Set shell = CreateObject("WScript.Shell")',
        ...sets,
        `shell.Run "${line}", 0, False`,
        "",
    ].join("\r\n")
}

/** The PowerShell that stops a running relay (never itself), passed encoded so no quoting survives the shell. */
const windowsStopCommand = (): string => {
    const script =
        "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | " +
        "Where-Object { $_.CommandLine -like '*starci-relay*listen*' -and $_.ProcessId -ne $PID } | " +
        "ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"
    return `powershell -NoProfile -NonInteractive -EncodedCommand ${Buffer.from(script, "utf16le").toString("base64")}`
}

const launchdContent = (host: ServiceHost): string => {
    const args = [host.nodePath, host.scriptPath, "listen", "--auto-confirm"]
    const env = envEntries(host)
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
        '<plist version="1.0">',
        "<dict>",
        `  <key>Label</key><string>${SERVICE_LABEL}</string>`,
        "  <key>ProgramArguments</key>",
        "  <array>",
        ...args.map((arg) => `    <string>${escapeXml(arg)}</string>`),
        "  </array>",
        ...(env.length === 0
            ? []
            : [
                  "  <key>EnvironmentVariables</key>",
                  "  <dict>",
                  ...env.map(([key, value]) => `    <key>${key}</key><string>${escapeXml(value)}</string>`),
                  "  </dict>",
              ]),
        "  <key>RunAtLoad</key><true/>",
        "  <key>KeepAlive</key><true/>",
        "</dict>",
        "</plist>",
        "",
    ].join("\n")
}

/** A value the systemd unit can hold on one line, quoted. */
const systemdQuote = (text: string): string => `"${text.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"')}"`

const systemdContent = (host: ServiceHost): string =>
    [
        "[Unit]",
        "Description=StarCi Relay",
        "After=network-online.target",
        "",
        "[Service]",
        `ExecStart=${systemdQuote(host.nodePath)} ${systemdQuote(host.scriptPath)} ${LISTEN_ARGS}`,
        ...envEntries(host).map(([key, value]) => `Environment=${systemdQuote(`${key}=${value}`)}`),
        "Restart=on-failure",
        "RestartSec=10",
        "",
        "[Install]",
        "WantedBy=default.target",
        "",
    ].join("\n")

/** The plan of this host: Windows Startup folder, a macOS launchd user agent or a Linux systemd user unit. */
export const servicePlanOf = (host: ServiceHost): ServicePlan => {
    if (host.platform === "win32") {
        const root = host.appData ?? joinPath("win32", host.home, "AppData", "Roaming")
        const path = joinPath("win32", root, "Microsoft", "Windows", "Start Menu", "Programs", "Startup", WINDOWS_STARTUP_FILE)
        return {
            path,
            content: windowsContent(host),
            start: [`wscript //nologo "${path}"`],
            stop: [windowsStopCommand()],
            where: "thư mục Startup của tài khoản Windows này",
        }
    }
    if (host.platform === "darwin") {
        const path = joinPath("darwin", host.home, "Library", "LaunchAgents", `${SERVICE_LABEL}.plist`)
        const domain = `gui/${host.uid ?? 0}`
        return {
            path,
            content: launchdContent(host),
            start: [`launchctl bootstrap ${domain} "${path}"`],
            stop: [`launchctl bootout ${domain}/${SERVICE_LABEL}`],
            where: "launchd agent của tài khoản macOS này",
        }
    }
    const path = joinPath("linux", host.home, ".config", "systemd", "user", SYSTEMD_UNIT)
    return {
        path,
        content: systemdContent(host),
        start: ["systemctl --user daemon-reload", `systemctl --user enable --now ${SYSTEMD_UNIT}`],
        stop: [`systemctl --user disable --now ${SYSTEMD_UNIT}`],
        where: "systemd user unit của tài khoản Linux này",
    }
}
