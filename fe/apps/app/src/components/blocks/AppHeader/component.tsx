import {
    AvatarButton,
    Badge,
    Button,
    Drawer,
    DropdownMenu,
    IconButton,
    Link,
    NavLandmark,
    Popover,
    Stack,
    Switch,
    Text,
    TopBar,
    type DropdownMenuItem,
} from "@starci/grammar/common"
import {
    BarFill,
    BarNav,
    BarWide,
    BellGlyph,
    BrandLockup,
    LanguageGlyph,
    languageMenuEntries,
    MenuGlyph,
    MoonGlyph,
    SunGlyph,
} from "@starci-next/ui"
import type {
    AppHeaderAccountShape,
    AppHeaderBaseProps,
    AppHeaderLanguage,
    AppHeaderLink,
    AppHeaderNotifications,
    AppHeaderStreak,
    AppHeaderTheme,
} from "./types"

export type * from "./types"

/** What the main navigation draws: its landmark name and its links. */
type MainLinksProps = {
    readonly label: string
    readonly links: ReadonlyArray<AppHeaderLink>
}

/** The main navigation: one named landmark of links, the current one marked. */
const MainLinks = (props: MainLinksProps) => (
    <NavLandmark label={props.label} layout="bar">
        {props.links.map((link) => (
            <Link key={link.id} href={link.href} isCurrent={link.isCurrent}>
                {link.label}
            </Link>
        ))}
    </NavLandmark>
)

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
    /** True in the drawer, where the words stay beside the switch and clicking them toggles it; the bar keeps the glyph switch alone. */
    readonly showLabel: boolean
    readonly onChange: (isDark: boolean) => void
}

/** The light and dark switch, a sun on the thumb in light and a moon in dark. */
const ThemeControl = (props: ThemeControlProps) => (
    <Switch
        label={props.theme.label}
        isLabelHidden={!props.showLabel}
        size="control"
        isSelected={props.theme.isDark}
        onSelectedChange={props.onChange}
        thumbIcon={SunGlyph}
        selectedThumbIcon={MoonGlyph}
    />
)

/** What the notifications popover reads: the drawing (only a signed-in reader has one), its words and state, and the command that marks them read. */
type NotificationsControlProps = {
    readonly shape: AppHeaderAccountShape
    readonly notifications: AppHeaderNotifications
    readonly onMarkAllRead: () => void
}

/** The notifications popover: a bell with the unread count, then the list with its links and the way to mark them read. */
const NotificationsControl = (props: NotificationsControlProps) => {
    const { notifications, shape } = props
    if (shape !== "signedIn") return null
    return (
        <Popover
            title={notifications.title}
            placement="bottom"
            trigger={
                <IconButton
                    source={BellGlyph}
                    label={notifications.label}
                    intent="dismiss"
                    badge={notifications.unreadCount}
                    badgeLabel={notifications.unreadLabel}
                />
            }
        >
            <Stack gap="row">
                {notifications.rows.length === 0 ? <Text tone="muted">{notifications.emptyLabel}</Text> : null}
                {notifications.rows.map((row) =>
                    row.href === undefined ? (
                        <Text key={row.id} isStrong={!row.isRead}>
                            {row.text}
                        </Text>
                    ) : (
                        <Link key={row.id} href={row.href}>
                            {row.text}
                        </Link>
                    ),
                )}
                {notifications.unreadCount === 0 ? null : (
                    <Button intent="neutral" isPending={notifications.isPending} onPress={props.onMarkAllRead}>
                        {notifications.markAllLabel}
                    </Button>
                )}
            </Stack>
        </Popover>
    )
}

/** The entries of the account menu: Premium and sign out for a signed-in reader, the way to sign in for any other drawing. */
const accountItemsOf = (props: AppHeaderBaseProps): ReadonlyArray<DropdownMenuItem> => {
    const { shape, props: p } = props
    switch (shape) {
        case "signedIn":
            return [
                { id: "premium", label: p.premiumLabel, href: p.premiumHref },
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
    return (
        <DropdownMenu
            placement="bottom end"
            trigger={<AvatarButton name={p.accountName} size="control" isDisabled={shape === "unknown"} />}
            entries={[{ kind: "section", id: "account", label: p.accountLabel, items: accountItemsOf(props) }]}
            onAction={(id) => {
                if (id === "sign-out") props.on.signOut()
                if (id === "sign-in") props.on.signIn()
            }}
        />
    )
}

/** What the streak chip reads: its words and whether the streak is running, or undefined while the streak is unknown. */
type StreakChipProps = { readonly streak: AppHeaderStreak | undefined }

/** The streak chip: amber (warning) for a running streak, neutral at none; nothing while the streak is unknown. */
const StreakChip = (props: StreakChipProps) =>
    props.streak === undefined ? null : (
        <Badge tone={props.streak.isActive ? "warning" : "neutral"}>{props.streak.label}</Badge>
    )

/** The plan badge of a signed-in reader whose entitlement is known; nothing for any other drawing. */
const PlanBadge = (props: AppHeaderBaseProps) => {
    const { plan } = props.props
    switch (props.shape) {
        case "signedIn":
            return plan === undefined ? null : <Badge tone={plan.tone}>{plan.label}</Badge>
        case "signedOut":
        case "unknown":
            return null
    }
}

/** The trailing actions, in the app bar's order: language and theme (left to the drawer on a compact bar), notifications for a signed-in reader, then the account. */
const Actions = (props: AppHeaderBaseProps) => (
    <>
        <BarWide>
            <StreakChip streak={props.props.streak} />
            <PlanBadge {...props} />
            <LanguageControl language={props.props.language} onChoose={props.on.chooseLanguage} />
            <ThemeControl theme={props.props.theme} showLabel={false} onChange={props.on.themeChange} />
        </BarWide>
        <NotificationsControl
            shape={props.shape}
            notifications={props.props.notifications}
            onMarkAllRead={props.on.markAllRead}
        />
        <AccountControl {...props} />
    </>
)

/**
 * Draws the app header band: the brand lockup, the main navigation (inline from 90rem, in the menu drawer below it), the plan badge, the
 * language menu and theme switch (in the drawer below 48rem), the notifications popover and the account menu; without reading the
 * route, the session, the entitlement or the copy.
 */
export const AppHeaderBase = (props: AppHeaderBaseProps) => (
    <>
        <BarFill>
            <TopBar
                brand={
                    <BrandLockup
                        brand={props.props.brand}
                        logoSrc={props.props.logoSrc}
                        homeHref={props.props.homeHref}
                        size="header"
                    />
                }
                navigation={
                    <BarNav>
                        <MainLinks label={props.props.navLabel} links={props.props.links} />
                    </BarNav>
                }
                actions={<Actions {...props} />}
                menu={{
                    icon: <MenuGlyph />,
                    openLabel: props.props.menuOpenLabel,
                    closeLabel: props.props.menuCloseLabel,
                    isOpen: props.props.isMenuOpen,
                    onOpenChange: props.on.menuOpenChange,
                    visibility: "always",
                }}
            />
        </BarFill>
        <Drawer
            title={props.props.menuTitle}
            placement="left"
            closeLabel={props.props.menuCloseLabel}
            isOpen={props.props.isMenuOpen}
            onOpenChange={props.on.menuOpenChange}
        >
            <Stack gap="row">
                <MainLinks label={props.props.navLabel} links={props.props.links} />
                <StreakChip streak={props.props.streak} />
                <PlanBadge {...props} />
                <LanguageControl language={props.props.language} onChoose={props.on.chooseLanguage} />
                <ThemeControl theme={props.props.theme} showLabel onChange={props.on.themeChange} />
            </Stack>
        </Drawer>
    </>
)
