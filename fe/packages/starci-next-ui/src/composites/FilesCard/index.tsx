import { Button, Cluster, FencedCodeBlock, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { FileGlyph } from "../../leaves/Icon"
import { FileView } from "../../branches/FileView"
import { WRAPPED_CODE_CLASS_NAME } from "./classNames"

/** One code file of a lab or an exercise. */
type ExerciseFile = { readonly path: string; readonly language: string; readonly content: string }

/** One command to run the lab, written for one operating system. */
type RunCommand = { readonly os: string; readonly osLabel: string; readonly command: string }

/** The files of a lab in one language, offered as a tab of the card's switch. */
type FilesVariant = {
    readonly id: string
    readonly label: string
    readonly files: ReadonlyArray<ExerciseFile>
    /** The download of this language's workspace; omitted, the card's own `downloadHref` stands. */
    readonly downloadHref?: string
    /** The button text for it, e.g. "Download workspace Java (.zip)". */
    readonly downloadLabel?: string
    /** The line over the commands, e.g. "Run in the unzipped folder, Java 21". */
    readonly runHeading?: string
    /** The commands of this language, one per operating system. Identical ones are drawn as one block without an OS label; different ones each under their OS. */
    readonly commands?: ReadonlyArray<RunCommand>
}

/** The code files of a lab or an exercise. */
type FilesCardProps = {
    /** The same lab in several languages; with two to four, the card heads a pill switch and lists the files of the chosen one. */
    readonly variants?: ReadonlyArray<FilesVariant>
    /** The accessible name of the language switch. */
    readonly variantLabel?: string
    /** The variant on screen; omitted, the first. */
    readonly variant?: string
    /** Called with the id of the tab the reader presses. */
    readonly onVariant?: (id: string) => void
    /** The name of the card, drawn as its label. */
    readonly label: string
    readonly files: ReadonlyArray<ExerciseFile>
    /** The verb of a row's command that opens its code; omitted, the command is named "code". */
    readonly openLabel?: string
    /** The accessible name of the code view's close button; omitted, the view closes with Escape or a press outside. */
    readonly closeLabel?: string
    /** Where the zip of the workspace is served; with `downloadLabel` it shows as a neutral download button in the head. */
    readonly downloadHref?: string
    readonly downloadLabel?: string
    /** The words of the Copy action of the code view and of its confirmation; omitted, "Copy" and "Copied". */
    readonly copyLabel?: string
    readonly copiedLabel?: string
}

/** The size of a file's text: bytes, or whole kilobytes. */
const sizeOf = (content: string): string => {
    const bytes = new TextEncoder().encode(content).length
    return bytes < 1024 ? `${bytes} B` : `${Math.ceil(bytes / 1024)} KB`
}

/** The muted line under a path: language and size. */
const metaOf = (file: ExerciseFile): string =>
    file.language === "" ? sizeOf(file.content) : `${file.language} \u00b7 ${sizeOf(file.content)}`

const noop = (): void => undefined

/** One tab of the language switch. */
type Tab = { readonly id: string; readonly label: string }

/** The two to four tabs the given slots hold, in order; the slots are filled from the front. */
const tabsOf = (a: Tab, b: Tab, c: Tab | undefined, d: Tab | undefined) => {
    if (c === undefined) return [a, b] as const
    return d === undefined ? ([a, b, c] as const) : ([a, b, c, d] as const)
}

/** The switch zone over a lab shipped in two to four languages, or no zone for a lab of one. */
const switchOf = (
    props: FilesCardProps,
    selected: string,
    onSelect: (id: string) => void,
): NonNullable<React.ComponentProps<typeof SurfaceCard>["headers"]> => {
    const items = (props.variants ?? []).map((variant) => ({ id: variant.id, label: variant.label }))
    const [a, b, c, d] = items
    if (a === undefined || b === undefined) return []
    const tabs = tabsOf(a, b, c, d)
    return [{ kind: "switch", label: props.variantLabel ?? props.label, items: tabs, selectedKey: selected, onSelect }]
}

/** The commands to run, as blocks: one block when every OS runs the same text, else one labelled block per OS. */
const commandBlocksOf = (
    commands: ReadonlyArray<RunCommand>,
): ReadonlyArray<{ readonly key: string; readonly label?: string; readonly command: string }> => {
    const first = commands[0]
    if (first === undefined) return []
    if (commands.every((each) => each.command === first.command)) return [{ key: "all", command: first.command }]
    return commands.map((each) => ({ key: each.os, label: each.osLabel, command: each.command }))
}

/** The variant whose commands are drawn. */
type RunBlocksProps = { readonly variant: FilesVariant }

/** The line over the commands and the commands of the chosen language. */
const RunBlocks = (props: RunBlocksProps) => {
    const blocks = commandBlocksOf(props.variant.commands ?? [])
    if (blocks.length === 0) return null
    return (
        <Stack gap="row">
            {props.variant.runHeading === undefined ? null : (
                <Text size="xs" tone="muted">
                    {props.variant.runHeading}
                </Text>
            )}
            {blocks.map((block) => (
                <Stack key={block.key} gap="identity">
                    {block.label === undefined ? null : (
                        <Text size="xs" tone="muted">
                            {block.label}
                        </Text>
                    )}
                    <FencedCodeBlock
                        label={block.label ?? props.variant.runHeading ?? block.command}
                        showLanguage={false}
                    >
                        <span className={WRAPPED_CODE_CLASS_NAME}>{block.command}</span>
                    </FencedCodeBlock>
                </Stack>
            ))}
        </Stack>
    )
}

/**
 * The code files of a lab or an exercise as a list card of file rows; each row opens its code in a view (long lines wrap, nothing
 * is cut). A lab that ships in several languages heads the card with the pill switch of its languages (the first by default) and
 * lists that language's files, its workspace download (a neutral button) and only its own commands.
 */
export const FilesCard = (props: FilesCardProps) => {
    const variants = props.variants ?? []
    const chosen = props.variant ?? variants[0]?.id ?? ""
    const selected = variants.find((variant) => variant.id === chosen)
    const shown = selected?.files ?? props.files
    const href = selected?.downloadHref ?? props.downloadHref
    const downloadLabel = selected?.downloadLabel ?? props.downloadLabel
    const download: NonNullable<React.ComponentProps<typeof SurfaceCard>["headers"]> =
        href === undefined || downloadLabel === undefined
            ? []
            : [
                  {
                      kind: "custom",
                      children: (
                          <Cluster gap="inline" justify="end">
                              <Button intent="neutral" size="sm" href={href} download>
                                  {downloadLabel}
                              </Button>
                          </Cluster>
                      ),
                  },
              ]
    const headers: NonNullable<React.ComponentProps<typeof SurfaceCard>["headers"]> = [
        ...switchOf(props, chosen, props.onVariant ?? noop),
        ...download,
    ]
    return (
        <SurfaceCard
            kind="list"
            label={props.label}
            headers={headers}
            items={shown.map((file) => ({
                id: file.path,
                title: file.path,
                description: metaOf(file),
                leading: { icon: FileGlyph },
                control: (
                    <FileView
                        file={file}
                        {...(props.openLabel === undefined ? {} : { openLabel: props.openLabel })}
                        {...(props.closeLabel === undefined ? {} : { closeLabel: props.closeLabel })}
                        {...(props.copyLabel === undefined ? {} : { copyLabel: props.copyLabel })}
                        {...(props.copiedLabel === undefined ? {} : { copiedLabel: props.copiedLabel })}
                    />
                ),
            }))}
            empty={props.label}
            {...(selected?.commands === undefined || selected.commands.length === 0
                ? {}
                : { footers: [{ kind: "custom" as const, children: <RunBlocks variant={selected} /> }] })}
        />
    )
}
