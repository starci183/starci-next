"use client"

import { useSyncExternalStore } from "react"

/** The width under which the page is drawn as a phone: Grammar's phone breakpoint. */
const PHONE_QUERY = "(max-width: 767px)"

/** Listens to the phone breakpoint. */
const subscribePhone = (onChange: () => void): (() => void) => {
    const query = window.matchMedia(PHONE_QUERY)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
}

/** Whether the window is a phone width now. */
const isPhoneNow = (): boolean => window.matchMedia(PHONE_QUERY).matches

/** The server draws the wide page first. */
const isPhoneOnServer = (): boolean => false

/** Whether the window is a phone width: the list shows fewer lines and the share sheet is a drawer. */
export const useIsPhone = (): boolean => useSyncExternalStore(subscribePhone, isPhoneNow, isPhoneOnServer)

/** Nothing to listen to: a browser does not gain a share sheet while a page is open. */
const subscribeNothing = (): (() => void) => () => undefined

/** Whether the browser has the system share sheet. */
const canShareNow = (): boolean => typeof navigator.share === "function"

/** The server cannot tell. */
const canShareOnServer = (): boolean => false

/** Whether the browser offers the system share sheet ("Ứng dụng khác"). */
export const useCanShare = (): boolean => useSyncExternalStore(subscribeNothing, canShareNow, canShareOnServer)

/** The address of the preview image the page head names (`og:image`), empty while none is there. */
const previewNow = (): string => document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? ""

/** The server draws before it can read the head. */
const previewOnServer = (): string => ""

/** The preview image of this CV link, read from the page head so the share sheet shows exactly what a pasted link shows. */
export const usePreviewSrc = (): string => useSyncExternalStore(subscribeNothing, previewNow, previewOnServer)
