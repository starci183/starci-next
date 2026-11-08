import type { IconSourceProps } from "@starci/grammar/common"
import { Bars3Icon, BellIcon, LanguageIcon, LockClosedIcon, MoonIcon, SunIcon } from "@heroicons/react/24/outline"
import { CircleIcon } from "@starci/heroicons/24/outline"

/** The decorative completion ring, delegated to the custom Heroicons cut. Visible copy supplies its meaning. */
export const Icon = () => <CircleIcon width={24} height={24} aria-hidden="true" />

/** What the lock needs: its accessible name. */
type LockIconProps = { readonly label: string }

/** The lock that marks what needs Premium, named for assistive technology by `label`. */
export const LockIcon = (props: LockIconProps) => (
    <LockClosedIcon width={16} height={16} role="img" aria-label={props.label} />
)

/** What the language glyph takes from the icon carrier that draws it. */
type LanguageGlyphProps = IconSourceProps

/** The translate glyph that stands for choosing the language; the language menu draws it, so no caller names a library. */
export const LanguageGlyph = (props: LanguageGlyphProps) => <LanguageIcon {...props} />

/** The three-bar glyph of the menu trigger that replaces the inline navigation on a compact width. */
export const MenuGlyph = () => <Bars3Icon width={24} height={24} aria-hidden="true" />

/** What the bell glyph takes from the icon carrier that draws it. */
type BellGlyphProps = IconSourceProps

/** The bell that stands for the reader's notifications; the bar's notifications button draws it. */
export const BellGlyph = (props: BellGlyphProps) => <BellIcon {...props} />

/** What the sun glyph takes from the icon carrier that draws it. */
type SunGlyphProps = IconSourceProps

/** The sun on the theme switch's thumb while the light theme is on. */
export const SunGlyph = (props: SunGlyphProps) => <SunIcon {...props} />

/** What the moon glyph takes from the icon carrier that draws it. */
type MoonGlyphProps = IconSourceProps

/** The moon on the theme switch's thumb while the dark theme is on. */
export const MoonGlyph = (props: MoonGlyphProps) => <MoonIcon {...props} />
