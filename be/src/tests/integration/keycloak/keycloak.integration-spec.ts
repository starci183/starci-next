import { KEYCLOAK_GATEWAY, KeycloakErrorCode, type KeycloakGateway } from "@modules/integrations/keycloak"
import { oidcIssuerClientOf, openOidcTransaction } from "../../world/fakes/oidc-issuer/oidc-issuer.client"
import { keycloakModules } from "../../world/keycloak-world.options"
import { useTestWorld } from "../../world/use-test-world"

const PASSPHRASE = `${openOidcTransaction().verifier}-ada`
const ADA = { username: "ada", email: "ada@example.test", password: PASSPHRASE, roles: ["member"] }

/**
 * keycloak sessions (integration): the gateway bound to the package broker, against an HTTPS issuer fake the app trusts through its
 * own http client. It proves the password grant, the refresh, the revocation and an outage, each as the KeycloakErrorCode it leaves as.
 */
describe("keycloak sessions (integration)", () => {
    const world = useTestWorld({ modules: keycloakModules })
    const gateway = (): KeycloakGateway => world.resolve<KeycloakGateway>(KEYCLOAK_GATEWAY)
    const signedIn = async () => {
        await oidcIssuerClientOf(world.fake.idp).seedUser(ADA)
        return gateway().passwordGrant(ADA.username, ADA.password)
    }

    it("signs a seeded account in and keeps only the refresh token", async () => {
        const tokens = await signedIn()

        expect(tokens).toMatchObject({ roles: ["member"], email: ADA.email })
        expect(tokens.refreshExpiresAt).toBeInstanceOf(Date)
        expect(tokens.refreshToken).not.toBe("")
    })

    it("rejects a wrong password with CredentialsRejected", async () => {
        await oidcIssuerClientOf(world.fake.idp).seedUser(ADA)

        await expect(gateway().passwordGrant(ADA.username, "not-the-passphrase")).rejects.toMatchObject({
            code: KeycloakErrorCode.CredentialsRejected,
        })
    })

    it("renews the session and rotates the refresh token", async () => {
        const tokens = await signedIn()

        const renewed = await gateway().refresh(tokens.refreshToken)

        expect(renewed.subject).toBe(tokens.subject)
        await expect(gateway().refresh(tokens.refreshToken)).rejects.toMatchObject({
            code: KeycloakErrorCode.CredentialsRejected,
        })
    })

    it("revokes the refresh token so it renews nothing", async () => {
        const tokens = await signedIn()

        await gateway().revoke(tokens.refreshToken)

        await expect(gateway().refresh(tokens.refreshToken)).rejects.toMatchObject({
            code: KeycloakErrorCode.CredentialsRejected,
        })
    })

    it("reports a provider that never answers as Unavailable", async () => {
        await world.fake.idp?.failNext({ timeout: true })

        await expect(gateway().passwordGrant(ADA.username, ADA.password)).rejects.toMatchObject({
            code: KeycloakErrorCode.Unavailable,
        })
    })
})
