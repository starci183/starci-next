"use client"

import type { IconSourceProps } from "@starci/grammar/common"
import type { ReactElement } from "react"
import {
    AcademicCapIcon,
    ArrowPathIcon,
    Bars3Icon,
    BellIcon,
    CheckBadgeIcon,
    CheckIcon,
    ChevronDoubleLeftIcon,
    CodeBracketIcon,
    CommandLineIcon,
    EllipsisHorizontalIcon,
    ExclamationTriangleIcon,
    FolderIcon,
    LanguageIcon,
    LightBulbIcon,
    LinkIcon,
    LockClosedIcon,
    MoonIcon,
    PlayIcon,
    SparklesIcon,
    SunIcon,
    UserCircleIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline"

/** The decorative check mark that bullets a benefit (an empty ring read as an unselected radio). Visible copy supplies its meaning. */
export const Icon = () => <CheckIcon width={24} height={24} aria-hidden="true" />

/** What the lock needs: its accessible name. */
type LockIconProps = { readonly label: string }

/** The lock that marks what needs Premium, named for assistive technology by `label`. */
export const LockIcon = (props: LockIconProps) => (
    <LockClosedIcon width={16} height={16} role="img" aria-label={props.label} />
)

/** The interviewer's glyph, for the icon tile beside the question the interviewer asks and what the interviewer wants to know. */
export const InterviewerGlyph = UserCircleIcon
/** The padlock glyph, for the icon tile of a notice about a part that needs Premium. */
export const LockGlyph = LockClosedIcon

/** The check that marks a finished part, named for assistive technology by `label`. */
type DoneIconProps = LockIconProps

/** The check that marks a finished part, named for assistive technology by `label`. */
export const DoneIcon = (props: DoneIconProps) => (
    <CheckIcon width={16} height={16} role="img" aria-label={props.label} />
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

/** What the LearnGlyph takes from the icon carrier that draws it. */
type LearnGlyphProps = IconSourceProps

/** The outline glyph of the learn home; the sidebar draws it. */
export const LearnGlyph = (props: LearnGlyphProps) => <AcademicCapIcon {...props} />

/** What the EssentialsGlyph takes from the icon carrier that draws it. */
type EssentialsGlyphProps = IconSourceProps

/** The outline glyph of the essentials; the sidebar draws it. */
export const EssentialsGlyph = (props: EssentialsGlyphProps) => <LightBulbIcon {...props} />

/** What the ReviewGlyph takes from the icon carrier that draws it. */
type ReviewGlyphProps = IconSourceProps

/** The outline glyph of the spaced review; the sidebar draws it. */
export const ReviewGlyph = (props: ReviewGlyphProps) => <ArrowPathIcon {...props} />

/** What the PracticeGlyph takes from the icon carrier that draws it. */
type PracticeGlyphProps = IconSourceProps

/** The outline glyph of code practice; the sidebar draws it. */
export const PracticeGlyph = (props: PracticeGlyphProps) => <CodeBracketIcon {...props} />

/** What the IncidentsGlyph takes from the icon carrier that draws it. */
type IncidentsGlyphProps = IconSourceProps

/** The outline glyph of the incidents; the sidebar draws it. */
export const IncidentsGlyph = (props: IncidentsGlyphProps) => <ExclamationTriangleIcon {...props} />

/** What the ProjectsGlyph takes from the icon carrier that draws it. */
type ProjectsGlyphProps = IconSourceProps

/** The outline glyph of the projects; the sidebar draws it. */
export const ProjectsGlyph = (props: ProjectsGlyphProps) => <FolderIcon {...props} />

/** What the AgentsGlyph takes from the icon carrier that draws it. */
type AgentsGlyphProps = IconSourceProps

/** The outline glyph of agents and AI; the sidebar draws it. */
export const AgentsGlyph = (props: AgentsGlyphProps) => <SparklesIcon {...props} />

/** What the ExperienceGlyph takes from the icon carrier that draws it. */
type ExperienceGlyphProps = IconSourceProps

/** The outline glyph of the verified experience; the sidebar draws it. */
export const ExperienceGlyph = (props: ExperienceGlyphProps) => <CheckBadgeIcon {...props} />

/** What the ProfileGlyph takes from the icon carrier that draws it. */
type ProfileGlyphProps = IconSourceProps

/** The outline glyph of the profile; the sidebar draws it. */
export const ProfileGlyph = (props: ProfileGlyphProps) => <UserCircleIcon {...props} />

/** What the MoreGlyph takes from the icon carrier that draws it. */
type MoreGlyphProps = IconSourceProps

/** The outline glyph of the compact navigation opener; the sidebar draws it. */
export const MoreGlyph = (props: MoreGlyphProps) => <EllipsisHorizontalIcon {...props} />

/** What the CollapseGlyph takes from the icon carrier that draws it. */
type CollapseGlyphProps = IconSourceProps

/** The outline double chevron of the sidebar's collapse button; the sidebar draws it. */
export const CollapseGlyph = (props: CollapseGlyphProps) => <ChevronDoubleLeftIcon {...props} />

/** What the file glyph takes from the icon carrier that draws it. */
type FileGlyphProps = IconSourceProps

/** The page-with-lines glyph that leads a file row or a case-study row. */
export const FileGlyph = (props: FileGlyphProps) => <DocumentTextIcon {...props} />

/** What the PlayGlyph takes from the icon carrier that draws it. */
type PlayGlyphProps = IconSourceProps

/** The outline play triangle (Heroicons); the primary continue/start button draws it as its start content. */
export const PlayGlyph = (props: PlayGlyphProps) => <PlayIcon {...props} />

/** What the TickGlyph takes from the icon carrier that draws it. */
type TickGlyphProps = IconSourceProps

/** The outline check (Heroicons), for the done tile that ticks a line the learner will be able to do. */
export const TickGlyph = (props: TickGlyphProps) => <CheckIcon {...props} />

/** What the TerminalGlyph takes from the icon carrier that draws it. */
type TerminalGlyphProps = IconSourceProps

/** The outline terminal prompt (Heroicons), for the tile of the setup step that installs the relay from a terminal. */
export const TerminalGlyph = (props: TerminalGlyphProps) => <CommandLineIcon {...props} />

/** What the PairGlyph takes from the icon carrier that draws it. */
type PairGlyphProps = IconSourceProps

/** The outline chain link (Heroicons), for the tile of the setup step that pairs the machine with the account. */
export const PairGlyph = (props: PairGlyphProps) => <LinkIcon {...props} />

/** What the FolderGlyph takes from the icon carrier that draws it. */
type FolderGlyphProps = IconSourceProps

/** The outline folder (Heroicons), for the tile of the setup step that picks the lab's folder on the machine. */
export const FolderGlyph = (props: FolderGlyphProps) => <FolderIcon {...props} />

/**
 * A glyph that is a number (owner 2026-11-28: "số 1-5 phải hình tròn chứ"): the numeral drawn on the 24 grid in the text's own face and the
 * icon's colour, so a round status mark (`IconTile state`) can carry a stage's place in the order as its subject. Its stroke is none: a
 * numeral is filled, never outlined.
 */
const numberGlyphOf = (n: number) => {
    const NumberGlyph = (props: IconSourceProps) => (
        <svg {...props} viewBox="0 0 24 24" fill="none">
            <text
                x="12"
                y="12"
                dominantBaseline="central"
                textAnchor="middle"
                fill="currentColor"
                stroke="none"
                fontFamily="inherit"
                fontSize="15"
                fontWeight="500"
                style={{ fontVariantNumeric: "tabular-nums" }}
            >
                {n}
            </text>
        </svg>
    )
    return NumberGlyph
}

/** The numerals 1 to 9 as glyphs, made once so a tile keeps the same component between renders. */
const NUMBER_GLYPHS: ReadonlyArray<(props: IconSourceProps) => ReactElement> = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(numberGlyphOf)

/** The glyph of the numeral `n`: the one made once for 1 to 9, a new one past them (the order of a short list, the relay's five stages). */
export const numberGlyph = (n: number): ((props: IconSourceProps) => ReactElement) => NUMBER_GLYPHS[n - 1] ?? numberGlyphOf(n)

/**
 * `size="item"` of Grammar's IconTile (0.64.9, owner 2026-11-28: a tile in a list's content is the round 24; a header's stays 40 or 48), spread
 * onto an `IconTile`. TODO(grammar 0.64.9 on npm): pass `size="item"` directly once the pin is past 0.64.7; until then the typed pin does not
 * know the value, a Grammar that does draws the 24, one that does not keeps its 40.
 */
export const ITEM_TILE = { size: "item" } as Record<never, never>
