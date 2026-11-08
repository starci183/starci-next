"use client"

import { useEffect } from "react"

/**
 * Sets the browser tab title of the screen once the data that names it has arrived (a topic or lesson title that only the client
 * read knows). `undefined` leaves the server-rendered title as it is.
 */
export const useDocumentTitle = (title: string | undefined): void => {
    useEffect(() => {
        if (title !== undefined) document.title = title
    }, [title])
}
