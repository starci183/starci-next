"use client"

import { useSyncExternalStore } from "react"

/** The page never changes its origin while it is open, so there is nothing to listen to. */
const noop = (): void => undefined

/** Subscribes to nothing. */
const subscribe = (): (() => void) => noop

/** The origin of the page in the browser. */
const originOfBrowser = (): string => window.location.origin

/** The server draws before it knows the origin. */
const originOfServer = (): string => ""

/** The origin the reader opened the app at (`https://host`), empty while the server draws; a public link is built on it. */
export const useOrigin = (): string => useSyncExternalStore(subscribe, originOfBrowser, originOfServer)
