import { Badge, Cluster, CopyField, IconTile, Link, Section, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { LogoChip, techIconColors, techIcons } from "@starci/grammar/core/ext/graph"
import { ITEM_TILE, ProjectsGlyph } from "../../leaves/Icon"
import { ItemLines } from "../ItemLines"
import { NarrationText, narrationTermsOf, type NarrationTerm } from "../Narration"

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
    /** The language folders of the repo, the default first: `ready` ones exist, `soon` ones are announced; empty when none declared. */
    readonly variants?: ReadonlyArray<CourseProductionVariantView>
    /** The technology icon names read from the repo (`typescript`, `nestjs`, `postgresql`); empty when none declared. */
    readonly stack?: ReadonlyArray<string>
    /** The main packages of the ready folder (`@nestjs/core`, `pg`); empty when none declared. */
    readonly libs?: ReadonlyArray<string>
}

/** One language folder of the StarCi standard: its label (`TypeScript · NestJS`), whether it exists yet, and its folder. */
export type CourseProductionVariantView = {
    readonly lang: string
    readonly label: string
    readonly status: "ready" | "soon"
    readonly folder: string
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
    /** What the learner did that none of the listed repos ships, one line of narration (inline markdown); empty when the record says none. */
    readonly beyond: string
    /** The narration's keywords and their notes (lessons.md §9). */
    readonly terms: ReadonlyArray<NarrationTerm>
}

/** The words of the gift page. */
export type CourseProductionLabels = {
    readonly title: string
    readonly lead: string
    /** The head of the StarCi standard's card ("StarCi standard"). */
    readonly standardTitle: string
    /** The words of the standard's language tabs and rows: a language not written yet, the tech stack row, the main packages row. */
    readonly soon: string
    readonly stackLabel: string
    readonly libsLabel: string
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

/** The name a reader knows a technology by, from its icon name (`nestjs` gives `NestJS`); an unknown one is shown as written. */
const TECH_NAMES: Readonly<Record<string, string>> = {
    typescript: "TypeScript",
    javascript: "JavaScript",
    nestjs: "NestJS",
    express: "Express",
    nodedotjs: "Node.js",
    postgresql: "PostgreSQL",
    mysql: "MySQL",
    mongodb: "MongoDB",
    redis: "Redis",
    docker: "Docker",
    kubernetes: "Kubernetes",
    rabbitmq: "RabbitMQ",
    apachekafka: "Kafka",
    jest: "Jest",
    go: "Go",
    rust: "Rust",
    python: "Python",
}

/** One technology: its brand logo in Grammar's logo chip (the diagram's), then its name. */
const Tech = (props: { readonly icon: string; readonly label?: string }) => {
    const mark = techIcons[props.icon]
    return (
        <Cluster gap="identity" align="center" wrap={false}>
            {mark === undefined ? null : <LogoChip icon={mark} color={techIconColors[props.icon]} />}
            <Text>{props.label ?? TECH_NAMES[props.icon] ?? props.icon}</Text>
        </Cluster>
    )
}

/** The icon of a language folder: its language's logo (`typescript`, `go`, `rust`). */
const LANG_ICONS: Readonly<Record<string, string>> = { typescript: "typescript", ts: "typescript", go: "go", golang: "go", rust: "rust", python: "python" }

/**
 * The language folders of the standard (owner 2026-11-28: "nhiều lib nhiều lang, kèm logo"): each folder with its language's logo; a folder
 * that exists reads in the accent, one announced reads muted with its "soon" word.
 */
const Variants = (props: { readonly variants: ReadonlyArray<CourseProductionVariantView>; readonly soon: string }) => (
    <Cluster gap="row" align="center">
        {props.variants.map((variant) =>
            variant.status === "ready" ? (
                <Badge key={variant.lang} tone="accent">
                    {variant.label}
                </Badge>
            ) : (
                <Badge key={variant.lang} tone="muted">
                    {`${variant.label} · ${props.soon}`}
                </Badge>
            ),
        )}
    </Cluster>
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
            headingLevel={3}
            labelEnd={standard.lang === "" || (standard.variants ?? []).length > 0 ? undefined : <Badge tone="neutral">{standard.lang}</Badge>}
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
                <Text as="p">
                    {standard.note}
                </Text>
                {(standard.variants ?? []).length === 0 ? null : (
                    <Variants variants={standard.variants ?? []} soon={labels.soon} />
                )}
                {(standard.stack ?? []).length === 0 ? null : (
                    <Stack gap="inline">
                        <Text as="p" role="label.item">
                            {labels.stackLabel}
                        </Text>
                        <Cluster gap="row" align="center">
                            {(standard.stack ?? []).map((icon) => (
                                <Tech key={icon} icon={LANG_ICONS[icon] ?? icon} />
                            ))}
                        </Cluster>
                    </Stack>
                )}
                {(standard.libs ?? []).length === 0 ? null : (
                    <Text as="p" role="caption" tone="muted">
                        {`${labels.libsLabel}: ${(standard.libs ?? []).join(" · ")}`}
                    </Text>
                )}
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
        // The gift is one section of the submit page, headed like every section of a lesson (title.section 16 / 500, its lead a
        // body line opening it; lessons.md "Cỡ chữ"): its parts are the section's sub-sections, one level deeper.
        <Section title={labels.title} headingLevel={2}>
            <Stack gap="region">
                {/* The gift's intro reads first, in body (a Section description draws as a 12 caption under the body). */}
                <Text as="p" tone="muted">
                    {labels.lead}
                </Text>
                {view.standard === undefined ? null : <Standard standard={view.standard} labels={labels} />}
                {/* The repos are lines to read (owner 2026-11-28: "sao logo mấy cái hình là vuông không phải tròn"; the tile sizes: read only is the
                    round 20): each repo its round 20 mark, its name, its essence, its language and the files it pins. */}
                <Section title={labels.reposTitle} caption={labels.reposNote} headingLevel={3}>
                    {view.repos.length === 0 ? (
                        <Text as="p" tone="muted">
                            {labels.reposEmpty}
                        </Text>
                    ) : (
                        <ItemLines
                            lines={view.repos.map((repo) => ({
                                id: repo.id,
                                mark: <IconTile source={ProjectsGlyph} tone="neutral" {...ITEM_TILE} />,
                                title: repo.name,
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
                    )}
                </Section>
                {view.beyond === "" ? null : (
                    <Section title={labels.beyondTitle} headingLevel={3}>
                        <Stack gap="inline" measure="reading">
                            <Text as="p">
                                <NarrationText text={view.beyond} terms={narrationTermsOf([view.beyond], view.terms)[0] ?? []} />
                            </Text>
                        </Stack>
                    </Section>
                )}
            </Stack>
        </Section>
    )
}
