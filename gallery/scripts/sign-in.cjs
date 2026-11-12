// Signs the disposable gallery learner in on the dev stack (signing up first, verifying through the mail sink) and saves the session.
// usage: node gallery/scripts/sign-in.cjs <credentials.json> <state.json>
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "D:/starci-tmp/pw-tool/node_modules/playwright")
const fs = require("fs")
const ENTRY = "http://localhost:3080"
const MAIL = "http://localhost:8025"
const [, , credFile, stateFile] = process.argv
const cred = JSON.parse(fs.readFileSync(credFile, "utf8"))
const lastMail = async (to) => {
    const list = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent("to:" + to)}`)).json()
    const m = list.messages?.[0]
    if (!m) return null
    return await (await fetch(`${MAIL}/api/v1/message/${m.ID}`)).json()
}
;(async () => {
    const b = await chromium.launch()
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
    const p = await ctx.newPage()
    await p.goto(`${ENTRY}/vi/sign-in`, { waitUntil: "networkidle" })
    await p.getByLabel(/Email hoặc tên đăng nhập/).fill(cred.email)
    await p
        .getByLabel(/^Mật khẩu/)
        .first()
        .fill(cred.password)
    await p.getByRole("button", { name: "Đăng nhập", exact: true }).click()
    await p.waitForTimeout(3000)
    if (/sign-in/.test(p.url())) {
        console.log("sign-in failed, signing up")
        await p.goto(`${ENTRY}/vi/sign-in`, { waitUntil: "networkidle" })
        await p.getByText("Đăng ký", { exact: true }).click()
        await p.getByLabel(/^Email/).fill(cred.email)
        await p
            .getByLabel(/^Mật khẩu/)
            .first()
            .fill(cred.password)
        await p.getByLabel(/Nhập lại mật khẩu/).fill(cred.password)
        await p.getByRole("checkbox").check({ force: true })
        await p.getByRole("button", { name: "Đăng ký", exact: true }).click()
        await p.waitForTimeout(4000)
        await p.screenshot({ path: "gallery/scripts/_signup.png" })
        const mail = await lastMail(cred.email)
        if (mail) {
            const text = mail.Text || ""
            const link = (text.match(/https?:\/\/\S+verify\/\S+/) || [])[0]
            const code = (text.match(/\b(\d{6})\b/) || [])[1]
            console.log("mail", mail.Subject, link ? "link" : "", code ? "code" : "")
            if (link) await p.goto(link.replace(/^https?:\/\/[^/]+/, ENTRY), { waitUntil: "networkidle" })
            else if (code) {
                await p.locator("input").first().fill(code)
                await p.keyboard.press("Enter")
            }
            await p.waitForTimeout(3000)
        } else console.log("no mail")
    }
    await p.goto(`${ENTRY}/vi`, { waitUntil: "networkidle" })
    await p.screenshot({ path: "gallery/scripts/_home.png" })
    console.log("url", p.url())
    await ctx.storageState({ path: stateFile })
    await b.close()
})().catch((e) => {
    console.error(e)
    process.exit(1)
})
