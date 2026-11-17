import axios from "axios"

/** The REST client of the object store: the browser sends the avatar bytes straight to the address the back end signed. */
const store = axios.create({ timeout: 60_000, validateStatus: () => true })

/** The signed upload the back end answered: the address and the headers that belong to its signature. */
export interface AvatarPutTarget {
    readonly url: string
    readonly headers: ReadonlyArray<{ readonly name: string; readonly value: string }>
}

/** The headers a browser may send on the signed upload: it sets the length from the body itself and refuses to be told. */
const headersOf = (headers: AvatarPutTarget["headers"]): Record<string, string> =>
    Object.fromEntries(
        headers
            .filter((header) => !["content-length", "host"].includes(header.name.toLowerCase()))
            .map((header) => [header.name, header.value]),
    )

/** Sends the picked file to the signed address; true when the store accepted it, false on any refusal or transport failure. */
export const putAvatar = async (target: AvatarPutTarget, file: File): Promise<boolean> => {
    try {
        const response = await store.put(target.url, file, { headers: headersOf(target.headers) })
        return response.status >= 200 && response.status < 300
    } catch {
        return false
    }
}
