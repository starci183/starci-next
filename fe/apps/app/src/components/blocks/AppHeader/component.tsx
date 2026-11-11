import {
    AvatarButton,
    DropdownMenu,
    IconButton,
    IdentityLockup,
    Switch,
    TopBar,
    useTopBarOverflowEntries,
    type DropdownMenuItem,
} from "@starci/grammar/common"
import {
    BarWide,
    LanguageGlyph,
    languageMenuEntries,
    MoonGlyph,
    SunGlyph,
} from "@starci-next/ui"
import type {
    AppHeaderBaseProps,
    AppHeaderLanguage,
    AppHeaderTheme,
} from "./types"

export type * from "./types"

/** What the language menu reads: its words and state, and the command that chooses a language. */
type LanguageControlProps = {
    readonly language: AppHeaderLanguage
    readonly onChoose: (locale: string) => void
}

/** The language menu: a tertiary glyph button that opens the single-select list of spoken languages. */
const LanguageControl = (props: LanguageControlProps) => {
    const { language } = props
    return (
        <DropdownMenu
            placement="bottom end"
            entries={languageMenuEntries({
                label: language.label,
                value: language.locale,
                options: language.options,
                isDisabled: language.isPending,
                onChange: props.onChoose,
            })}
            trigger={
                <IconButton
                    source={LanguageGlyph}
                    label={language.label}
                    intent="dismiss"
                    isDisabled={language.isPending}
                />
            }
        />
    )
}

/** What the theme switch reads: its name and state, and the command that sets the theme. */
type ThemeControlProps = {
    readonly theme: AppHeaderTheme
    readonly onChange: (isDark: boolean) => void
}

/** The light and dark switch, a sun on the thumb in light and a moon in dark. */
const ThemeControl = (props: ThemeControlProps) => (
    <Switch
        label={props.theme.label}
        isLabelHidden
        size="control"
        isSelected={props.theme.isDark}
        onSelectedChange={props.onChange}
        thumbIcon={SunGlyph}
        selectedThumbIcon={MoonGlyph}
    />
)

/** The entries of the account menu: the identity row, the plan command, the profile and sign out for a signed-in reader, the way to sign in for any other drawing. */
const accountItemsOf = (props: AppHeaderBaseProps): ReadonlyArray<DropdownMenuItem> => {
    const { shape, props: p } = props
    switch (shape) {
        case "signedIn":
            return [
                { id: "identity", label: p.identity.title, description: p.identity.subtitle },
                { id: "plan", label: p.plan.label, href: p.plan.href },
                { id: "profile", label: p.profileLabel, href: p.profileHref },
                { id: "sign-out", label: p.signOutLabel, tone: "danger", isDisabled: p.signOutPending },
            ]
        case "signedOut":
        case "unknown":
            return [{ id: "sign-in", label: p.signInLabel }]
    }
}

/** The account menu: the signed-in reader's avatar with Premium and sign out, or the guest avatar (disabled while the session is unknown) with the way to sign in. */
const AccountControl = (props: AppHeaderBaseProps) => {
    const { shape, props: p } = props
    const overflow = useTopBarOverflowEntries()
    return (
        <DropdownMenu
            placement="bottom end"
            trigger={<AvatarButton name={p.accountName} size="control" isDisabled={shape === "unknown"} />}
            entries={[{ kind: "section", id: "account", label: p.accountLabel, items: accountItemsOf(props) }, ...overflow]}
            onAction={(id) => {
                if (id === "sign-out") props.on.signOut()
                if (id === "sign-in") props.on.signIn()
            }}
        />
    )
}

/** The trailing actions, in the shell bar's order: the language menu, the theme switch, then the account (its menu also carries the custom buttons that left the bar at phone width). */
const Actions = (props: AppHeaderBaseProps) => (
    <>
        <BarWide>
            <LanguageControl language={props.props.language} onChoose={props.on.chooseLanguage} />
            <ThemeControl theme={props.props.theme} onChange={props.on.themeChange} />
        </BarWide>
        <AccountControl {...props} />
    </>
)

/**
 * Draws the shell's top bar, composed as the NIVO console bar (ConsoleHeader): the brand lockup (logo, name over a muted role and plan
 * line) at the start; at the end the round language button and the theme switch (from the wide rail up; the navigation drawer carries them
 * below it) and the account menu. The streak lives in the learn page aside; the bell is a TopBar `customButtons` entry (0.37.15) the connected block adds when the app has a notifications page. Without reading the route, the session or the copy.
 */
export const AppHeaderBase = (props: AppHeaderBaseProps) => (
    <TopBar
        position="sticky"
        brand={
            <IdentityLockup
                title={props.props.brand.name}
                subtitle={props.props.brand.roleLine}
                logoSrc={props.props.brand.logoSrc}
                size="control"
                onPress={props.on.goHome}
            />
        }
        actions={<Actions {...props} />}
        {...(props.props.customButtons.length === 0 ? {} : { customButtons: props.props.customButtons })}
    />
)
