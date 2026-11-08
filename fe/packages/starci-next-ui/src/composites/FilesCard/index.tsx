import { FencedCodeBlock, Stack, SurfaceCard } from "@starci/grammar/common"

/** The code files of a lab or an exercise. */
type FilesCardProps = {
    /** The accessible name of the card. */
    readonly label: string
    readonly files: ReadonlyArray<{ readonly path: string; readonly language: string; readonly content: string }>
}

/** The code files of a lab or an exercise, each in its own bounded frame named by its path. */
export const FilesCard = (props: FilesCardProps) => (
    <SurfaceCard ariaLabel={props.label}>
        <Stack gap="row">
            {props.files.map((file) => (
                <FencedCodeBlock
                    key={file.path}
                    label={file.path}
                    code={file.content}
                    {...(file.language === "" ? {} : { language: file.language })}
                />
            ))}
        </Stack>
    </SurfaceCard>
)
