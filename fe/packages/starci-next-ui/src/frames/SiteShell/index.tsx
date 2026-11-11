"use client"

import type { ReactNode } from "react"
import { Link, TopBar, WorkspaceShell } from "@starci/grammar/common"
import { MoreGlyph } from "../../leaves/Icon"

/** The side navigation a shell can carry: the wide rail, its landmark name and the compact-width drawer that holds the same list. */
type SiteShellNavigation = {
    /** The wide rail (a `Sidebar` with `presentation="rail"`). */
    readonly rail: Exclude<ReactNode, null | undefined | boolean>
    /** The rail's landmark name. */
    readonly label: string
    /** The drawer body (a `Sidebar` with `presentation="drawer"`). */
    readonly drawerContent: ReactNode
    /** The drawer's title and dialog name. */
    readonly drawerTitle: string
    /** The opener button's accessible name. */
    readonly openLabel: string
    /** The drawer close button's accessible name. */
    readonly closeLabel: string
}

/** What an app's chrome hands the shell: the brand, its home link, the side navigation and the routed body. */
type SiteShellProps = {
    /** The wordmark; it also names the page's main landmark. */
    readonly brand: string
    /** The destination of the wordmark: the app's front door. */
    readonly homeHref: string
    /** The app's own header band (a top bar); the shell draws the plain brand bar when the app gives none. */
    readonly header?: ReactNode
    /** The side navigation; without it the shell is the header over the body. */
    readonly navigation?: SiteShellNavigation
    /** The routed page body. */
    readonly children: ReactNode
}

/**
 * The document chrome both apps share (inside the providers' Grammar root): the header band, the side navigation (a white rail from the wide
 * breakpoint, a drawer below it), then the routed body in the shell's main landmark. The shell is one viewport tall when it has a side
 * navigation, so the rail stays put and the body scrolls on its own; each route page draws its own Page, which owns the measure.
 */
export const SiteShell = (props: SiteShellProps) => {
    const header = props.header ?? <TopBar brand={<Link variant="plain" href={props.homeHref}>{props.brand}</Link>} />
    const { navigation } = props
    return navigation === undefined ? (
        <WorkspaceShell viewport="flow" primaryLabel={props.brand} header={header} primary={props.children} />
    ) : (
        <WorkspaceShell
            viewport="fixed"
            align="stretch"
            primaryLabel={props.brand}
            header={header}
            headerLandmark="slot"
            navigation={navigation.rail}
            navigationLabel={navigation.label}
            navigationTrack="intrinsic"
            navigationVisibility="wide"
            navigationDrawer={{
                title: navigation.drawerTitle,
                openLabel: navigation.openLabel,
                closeLabel: navigation.closeLabel,
                source: MoreGlyph,
                defaultOpen: false,
                content: navigation.drawerContent,
                rowTitle: navigation.openLabel,
            }}
            primary={props.children}
        />
    )
}
