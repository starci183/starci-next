import { KEYCLOAK_GATEWAY, KeycloakErrorCode, type KeycloakGateway } from "@modules/integrations/keycloak"
import { oidcIssuerClientOf, openOidcTransaction } from "../../world/fakes/oidc-issuer/oidc-issuer.client"
import { keycloakModules } from "../../world/keycloak-world.options"
import { useTestWorld } from "../../world/use-test-world"

const GRACE = { sub: "social-1", email: "grace@example.test", roles: ["member"] }
const NEW_USER = { email: "ada@example.test", username: "ada", password: `${openOidcTransaction().verifier}-ada` }

/**
 * keycloak social and sign-up (integration): the authorization address with kc_idp_hint, the code exchange and the admin API
 * through the gateway. It proves a claimed code becomes an identity, a wrong verifier is SocialRejected and a taken email is EmailRegistered.
 */
describe("keycloak social and sign-up (integration)", () => {
    const world = useTestWorld({ modules: keycloakModules })
    const gateway = (): KeycloakGateway => world.resolve<KeycloakGateway>(KEYCLOAK_GATEWAY)
    const claimedCode = async () => {
        const transaction = openOidcTransaction()
        const url = await gateway().socialAuthorizationUrl({
            provider: "github",
            state: transaction.state,
            nonce: transaction.nonce,
            codeChallenge: transaction.challenge,
        })
        const redirect = await oidcIssuerClientOf(world.fake.idp).authorize(url, GRACE)
        return { transaction, code: new URL(redirect).searchParams.get("code") ?? "" }
    }

    it("sends the browser to the broker with kc_idp_hint and an S256 challenge", async () => {
        const { transaction } = await claimedCode()

        await expect(oidcIssuerClientOf(world.fake.idp).idpHints()).resolves.toEqual(["github"])
        expect(transaction.challenge).not.toBe("")
    })

    it("exchanges a claimed code into an identity with a refresh token", async () => {
        const { transaction, code } = await claimedCode()

        await expect(
            gateway().exchangeSocialCode({ code, codeVerifier: transaction.verifier, nonce: transaction.nonce }),
        ).resolves.toMatchObject({ subject: "social-1", email: GRACE.email })
    })

    it("rejects a code presented with another verifier as SocialRejected", async () => {
        const { transaction, code } = await claimedCode()

        await expect(
            gateway().exchangeSocialCode({
                code,
                codeVerifier: openOidcTransaction().verifier,
                nonce: transaction.nonce,
            }),
        ).rejects.toMatchObject({ code: KeycloakErrorCode.SocialRejected })
    })

    it("creates an account, finds it by email and refuses a second one as EmailRegistered", async () => {
        const { subject } = await gateway().createUser(NEW_USER)

        await expect(gateway().findUserByEmail(NEW_USER.email)).resolves.toEqual({ subject, username: "ada" })
        await expect(gateway().createUser({ ...NEW_USER, username: "ada-2" })).rejects.toMatchObject({
            code: KeycloakErrorCode.EmailRegistered,
        })
    })
})
