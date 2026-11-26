import type { ConfigEnv } from "./relay-client.config"

/**
 * The SPKI PEM of the PUBLIC half of the key StarCi Next production signs task manifests with, shipped in the package so a
 * learner needs no setup. Empty until the owner publishes it (the private half is a SOPS secret that is never opened to
 * derive it); an empty key makes the CLI refuse to run unsigned checks, as it always did.
 */
export const PROD_MANIFEST_KEY = ""

/**
 * The SPKI PEM of the PUBLIC half of the dev stack's manifest key (`manifest-public.pem` of its relay-dev data folder), shipped so a learner on dev needs no
 * `STARCI_NEXT_MANIFEST_KEY` setup. Only the public half; the signing half never leaves the dev stack's data folder. Regenerating the dev key pair means
 * updating this constant.
 */
export const DEV_MANIFEST_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEABb5d09VUtt4ag/Ca7ZNUdi8yheRW/OdEZOzakSlz4EQ=
-----END PUBLIC KEY-----
`

/** One environment of StarCi Next: the hosts its relay answers on and the public key its manifests are signed with. */
interface ManifestKeyEntry {
    readonly hosts: ReadonlyArray<string>
    readonly pem: string
}

/** The hosts are those of the `production` and `dev` environments of `.starcistacks/application-stacks.yaml`; the dev ingress and core answer on loopback too. */
const MANIFEST_KEYS: ReadonlyArray<ManifestKeyEntry> = [
    { hosts: ["next.starci.org", "api.next.starci.org"], pem: PROD_MANIFEST_KEY },
    {
        hosts: [
            "starci-next-app-dev.starci.org",
            "starci-next-api-dev.starci.org",
            "starci-next-dev.starci.org",
            "localhost",
            "127.0.0.1",
        ],
        pem: DEV_MANIFEST_KEY,
    },
]

/** The host of an origin, or null when it is not a URL. */
const hostOf = (origin: string): string | null => {
    try {
        return new URL(origin).hostname.toLowerCase()
    } catch {
        return null
    }
}

/**
 * The manifest key this machine verifies with for the StarCi origin it talks to: `STARCI_NEXT_MANIFEST_KEY` when set (any
 * origin, staging included), else the public key built into the package for that origin's environment, else empty.
 */
export const manifestKeyOf = (env: ConfigEnv, baseUrl: string): string => {
    if (env.STARCI_NEXT_MANIFEST_KEY) return env.STARCI_NEXT_MANIFEST_KEY
    const host = hostOf(baseUrl)
    return MANIFEST_KEYS.find((entry) => host !== null && entry.hosts.includes(host))?.pem ?? ""
}
