import type { AxiosInstance } from "axios"

/** Attaches the language of the page as `Accept-Language` to every call of a REST client, so the back end words its mail and its refusals in the language the learner reads. */
export const attachLocaleLink = (client: AxiosInstance): void => {
    client.interceptors.request.use((config) => {
        if (typeof document !== "undefined" && document.documentElement.lang !== "") {
            config.headers.set("Accept-Language", document.documentElement.lang)
        }
        return config
    })
}
