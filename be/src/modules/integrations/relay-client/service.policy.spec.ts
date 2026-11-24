import { servicePlanOf, type ServiceHost } from "./service.policy"

const NOOP = () => undefined

const hostOf = (overrides: Partial<ServiceHost>): ServiceHost => ({
    platform: "linux",
    home: "/home/hv",
    appData: undefined,
    uid: 1000,
    nodePath: "/usr/bin/node",
    scriptPath: "/usr/lib/node_modules/@starci/next-relay/dist/bundle/starci-relay.cjs",
    env: {},
    write: NOOP,
    remove: NOOP,
    exists: () => false,
    shell: () => Promise.resolve(0),
    ...overrides,
})

describe("servicePlanOf", () => {
    it("builds a systemd user unit that runs listen on its own, with no root path", () => {
        const plan = servicePlanOf(hostOf({ env: { STARCI_NEXT_URL: "https://app.test" } }))

        expect(plan.path).toBe("/home/hv/.config/systemd/user/starci-relay.service")
        expect(plan.content).toContain(
            'ExecStart="/usr/bin/node" "/usr/lib/node_modules/@starci/next-relay/dist/bundle/starci-relay.cjs" listen --auto-confirm',
        )
        expect(plan.content).toContain('Environment="STARCI_NEXT_URL=https://app.test"')
        expect(plan.content).toContain("WantedBy=default.target")
        expect(plan.start).toEqual(["systemctl --user daemon-reload", "systemctl --user enable --now starci-relay.service"])
        expect(plan.stop).toEqual(["systemctl --user disable --now starci-relay.service"])
    })

    it("builds a launchd user agent bootstrapped into the user's own gui domain", () => {
        const plan = servicePlanOf(hostOf({ platform: "darwin", home: "/Users/hv", uid: 501 }))

        expect(plan.path).toBe("/Users/hv/Library/LaunchAgents/vn.starci.relay.plist")
        expect(plan.content).toContain("<string>listen</string>")
        expect(plan.content).toContain("<key>RunAtLoad</key><true/>")
        expect(plan.start).toEqual([`launchctl bootstrap gui/501 "/Users/hv/Library/LaunchAgents/vn.starci.relay.plist"`])
        expect(plan.stop).toEqual(["launchctl bootout gui/501/vn.starci.relay"])
    })

    it("builds a windowless script in the user's Startup folder", () => {
        const plan = servicePlanOf(
            hostOf({
                platform: "win32",
                home: "C:\\Users\\hv",
                appData: "C:\\Users\\hv\\AppData\\Roaming",
                nodePath: "C:\\Program Files\\nodejs\\node.exe",
                scriptPath: "C:\\Users\\hv\\AppData\\Roaming\\npm\\node_modules\\@starci\\next-relay\\dist\\bundle\\starci-relay.cjs",
            }),
        )

        expect(plan.path).toBe(
            "C:\\Users\\hv\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\StarCi Relay.vbs",
        )
        expect(plan.content).toContain('shell.Run """C:\\Program Files\\nodejs\\node.exe"" ""C:\\Users')
        expect(plan.content).toContain("listen --auto-confirm\", 0, False")
        expect(plan.start[0]).toContain("wscript //nologo")
        expect(plan.stop[0]).toMatch(/^powershell -NoProfile -NonInteractive -EncodedCommand [A-Za-z0-9+/=]+$/u)
    })
})
