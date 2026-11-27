import { Badge, CopyField, Link, Section, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { ProjectsGlyph } from "../../leaves/Icon"

/** A link into a gift repo: the path it opens, as the reader sees it, and where it goes. */
export type CourseProductionLinkView = {
    readonly path: string
    readonly url: string
}

/**
 * The StarCi standard of the lesson, the first gift repo: its essence in a few sentences and the one command that fetches it next to the
 * learner's lab. Its code lives in the repo, never on the page (lessons.md §7, owner 2026-11-28).
 */
export type CourseProductionStandardView = {
    /** The repo's name (`starci-next/essential-saga`). */
    readonly name: string
    /** The language of the repo, on the card's badge. */
    readonly lang: string
    /** The day it was checked, in one muted line; empty when the record says none. */
    readonly meta: string
    /** Its essence: how it does the idea and where it differs from the learner's code, a few sentences. */
    readonly note: string
    /** The relay command that fetches it beside the lab; empty when the record names none. */
    readonly command: string
    /** The folder of the repo the command fetches, as a link. */
    readonly link: CourseProductionLinkView | undefined
}

/** One public repo that runs the same idea for real users: its essence in a few sentences, its language and the files it pins. */
export type CourseProductionRepoView = {
    readonly id: string
    readonly name: string
    /** The language and, when the record says, the day its files were checked, in one muted line. */
    readonly meta: string
    /** Its essence and how it is like or unlike the learner's code: a few sentences, read in full. */
    readonly note: string
    readonly links: ReadonlyArray<CourseProductionLinkView>
}

/** What the submit page draws once the learner's code passed: the gift repos. */
export type CourseProductionView = {
    /** The StarCi standard; undefined when the record pins none. */
    readonly standard: CourseProductionStandardView | undefined
    readonly repos: ReadonlyArray<CourseProductionRepoView>
    /** What the learner did that none of the listed repos ships; empty when the record says none. */
    readonly beyond: string
}

/** The words of the gift page. */
export type CourseProductionLabels = {
    readonly title: string
    readonly lead: string
    /** The head of the StarCi standard's card ("StarCi standard"). */
    readonly standardTitle: string
    /** The label of the command that fetches the standard, read by assistive technology and above the field. */
    readonly commandLabel: string
    readonly reposTitle: string
    /** One muted line under the world repos: every note is read from the pinned files, and the code stays in the repo. */
    readonly reposNote: string
    readonly reposEmpty: string
    readonly beyondTitle: string
    readonly externalHint: string
    readonly copy: string
    readonly copied: string
    readonly copyFailed: string
}

/** What the gift page needs. */
type CourseProductionProps = {
    readonly view: CourseProductionView
    readonly labels: CourseProductionLabels
}

/** What the links of a repo need: the links and the hint that says they open in a new tab. */
type LinksProps = {
    readonly links: ReadonlyArray<CourseProductionLinkView>
    readonly externalHint: string
}

/** What the StarCi standard's card needs. */
type StandardProps = {
    readonly standard: CourseProductionStandardView
    readonly labels: CourseProductionLabels
}

/** The external links of a repo, each opening in a new tab. */
const Links = (props: LinksProps) => (
    <Stack gap="identity">
        {props.links.map((link) => (
            <Link key={link.url} href={link.url} kind="external" externalHint={props.externalHint}>
                {link.path}
            </Link>
        ))}
    </Stack>
)

/**
 * The StarCi standard as the one card of the page (a real thing the learner takes home): its name, its essence, the relay command that
 * fetches it next to the lab and the folder it lives in.
 */
const Standard = (props: StandardProps) => {
    const { standard, labels } = props
    return (
        <SurfaceCard
            label={labels.standardTitle}
            headingLevel={2}
            labelEnd={standard.lang === "" ? undefined : <Badge tone="neutral">{standard.lang}</Badge>}
        >
            <Stack gap="section">
                <Stack gap="identity">
                    <Text as="p" isStrong>
                        {standard.name}
                    </Text>
                    {standard.meta === "" ? null : (
                        <Text as="p" role="caption" tone="muted">
                            {standard.meta}
                        </Text>
                    )}
                </Stack>
                <Text as="p" role="reading.body">
                    {standard.note}
                </Text>
                {standard.command === "" ? null : (
                    <CopyField
                        label={labels.commandLabel}
                        value={standard.command}
                        copyLabel={labels.copy}
                        copiedLabel={labels.copied}
                        copyErrorLabel={labels.copyFailed}
                    />
                )}
                {standard.link === undefined ? null : (
                    <Links links={[standard.link]} externalHint={labels.externalHint} />
                )}
            </Stack>
        </SurfaceCard>
    )
}

/**
 * The second half of the submit page, shown once the learner's code passed: the gift. First the StarCi standard with the command that
 * fetches it, then the public repos that run the same idea for real users, each one the essence and a few sentences on how it is like or
 * unlike the learner's code, then what the learner did that none of them ships. No code and no diff stands on the page: the code is in
 * the repos (lessons.md §7, owner 2026-11-28).
 */
export const CourseProduction = (props: CourseProductionProps) => {
    const { view, labels } = props
    return (
        <Stack gap="region">
            <Stack gap="section" measure="reading">
                <Text as="p" role="reading.title">
                    {labels.title}
                </Text>
                <Text as="p" role="reading.body" tone="muted">
                    {labels.lead}
                </Text>
            </Stack>
            {view.standard === undefined ? null : <Standard standard={view.standard} labels={labels} />}
            <Section
                kind="list"
                title={labels.reposTitle}
                caption={labels.reposNote}
                headingLevel={2}
                empty={labels.reposEmpty}
                items={view.repos.map((repo) => ({
                    id: repo.id,
                    title: repo.name,
                    // The identity tile of a repo: every row is the same kind of thing, so one glyph on the neutral plate.
                    leading: { icon: ProjectsGlyph },
                    // The note is a few sentences: a row's description is one line with an ellipsis by design
                    // (DNA-COMMON-ROW-DESCRIPTION-ONE-LINE), so it is read in full as the first line of the row's detail.
                    detail: (
                        <Stack gap="identity">
                            <Text as="p" tone="muted">
                                {repo.note}
                            </Text>
                            <Text as="p" role="caption" tone="muted">
                                {repo.meta}
                            </Text>
                            <Links links={repo.links} externalHint={labels.externalHint} />
                        </Stack>
                    ),
                }))}
            />
            {view.beyond === "" ? null : (
                <Section title={labels.beyondTitle} headingLevel={2}>
                    <Stack gap="inline" measure="reading">
                        <Text as="p" role="reading.body">
                            {view.beyond}
                        </Text>
                    </Stack>
                </Section>
            )}
        </Stack>
    )
}
