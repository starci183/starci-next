import type { IconSourceProps } from "@starci/grammar/common"
import {
    AcademicCapIcon,
    ArrowPathIcon,
    Bars3Icon,
    BellIcon,
    ChatBubbleLeftRightIcon,
    CheckBadgeIcon,
    ChevronDoubleLeftIcon,
    CodeBracketIcon,
    EllipsisHorizontalIcon,
    ExclamationTriangleIcon,
    FolderIcon,
    LanguageIcon,
    LightBulbIcon,
    LockClosedIcon,
    MoonIcon,
    PlayIcon,
    SparklesIcon,
    SunIcon,
    UserCircleIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline"
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

/** What the InterviewGlyph takes from the icon carrier that draws it. */
type InterviewGlyphProps = IconSourceProps

/** The outline glyph of the mock interview; the sidebar draws it. */
export const InterviewGlyph = (props: InterviewGlyphProps) => <ChatBubbleLeftRightIcon {...props} />

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
