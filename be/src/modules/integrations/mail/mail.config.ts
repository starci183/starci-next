import type { MailSecurity } from "@starci/mail"
import type { EnvSource } from "@modules/platform/config"
import type { MailLanguage, MailOptions } from "./mail.options"

const DEFAULT_PORT = 587

const SECURITIES: ReadonlyArray<MailSecurity> = ["tls", "starttls", "none"]
const LANGUAGES: ReadonlyArray<MailLanguage> = ["vi", "en"]

/** Reads the mail configuration with no credential or server defaults; the login is optional and its password reads `<KEY>_FILE` first. */
export const parseMailConfig = (env: EnvSource): MailOptions => ({
    host: env.string("MAIL_HOST"),
    port: env.int("MAIL_PORT", DEFAULT_PORT),
    security: env.has("MAIL_SECURITY") ? env.enum("MAIL_SECURITY", SECURITIES) : "starttls",
    ...(env.has("MAIL_USER") ? { auth: { user: env.string("MAIL_USER"), pass: env.secret("MAIL_PASSWORD") } } : {}),
    from: { name: env.string("MAIL_FROM_NAME"), address: env.string("MAIL_FROM") },
    brandName: env.string("MAIL_FROM_NAME"),
    defaultLanguage: env.has("MAIL_DEFAULT_LANGUAGE") ? env.enum("MAIL_DEFAULT_LANGUAGE", LANGUAGES) : "en",
})
