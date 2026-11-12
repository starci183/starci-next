"use client"

import { useState } from "react"
import { Button, Dialog, FencedCodeBlock } from "@starci/grammar/common"
import { HighlightedCode } from "../../branches/HighlightedCode"

/** One code file of a lab or an exercise. */
type ExerciseFile = { readonly path: string; readonly language: string; readonly content: string }

/** What the code view of a file needs: the file and the words of its commands. */
export type FileViewProps = {
    readonly file: ExerciseFile
    readonly openLabel?: string
    readonly closeLabel?: string
    readonly copyLabel?: string
    readonly copiedLabel?: string
}

/** The names a code view shows for a language id. */
const LANGUAGE_LABELS: Readonly<Record<string, string>> = {
    bash: "Bash",
    csharp: "C#",
    cs: "C#",
    css: "CSS",
    go: "Go",
    html: "HTML",
    java: "Java",
    javascript: "JavaScript",
    js: "JavaScript",
    json: "JSON",
    markdown: "Markdown",
    python: "Python",
    shell: "Shell",
    sh: "Bash",
    sql: "SQL",
    ts: "TypeScript",
    tsx: "TSX",
    typescript: "TypeScript",
    xml: "XML",
    yaml: "YAML",
    yml: "YAML",
}

/** The name of a language for the code view's header; the id itself when it has no name here. */
const languageLabelOf = (language: string): string => LANGUAGE_LABELS[language.toLowerCase()] ?? language

/** What the Copy action of a code view needs: the code and the words. */
type CopyActionProps = { readonly code: string; readonly copyLabel: string; readonly copiedLabel: string }

/** The Copy action of a code view: writes the file to the clipboard and says so. */
const CopyAction = (props: CopyActionProps) => {
    const [isCopied, setIsCopied] = useState(false)
    const copy = (): void => {
        navigator.clipboard
            .writeText(props.code)
            .then(() => setIsCopied(true))
            .catch(() => setIsCopied(false))
    }
    return (
        <Button intent="neutral" size="sm" onPress={copy}>
            {isCopied ? props.copiedLabel : props.copyLabel}
        </Button>
    )
}

/** One file's code in its own view, opened by the command at the end of its row: Grammar's frame and Copy around the Shiki-coloured code (monospace, scrolls inline). */
export const FileView = (props: FileViewProps) => (
    <Dialog
        title={props.file.path}
        size="lg"
        {...(props.closeLabel === undefined ? {} : { closeLabel: props.closeLabel })}
        trigger={
            <Button intent="neutral" size="sm">
                {props.openLabel ?? "code"}
            </Button>
        }
    >
        <FencedCodeBlock
            label={props.file.path}
            action={
                <CopyAction
                    code={props.file.content}
                    copyLabel={props.copyLabel ?? "Copy"}
                    copiedLabel={props.copiedLabel ?? "Copied"}
                />
            }
            {...(props.file.language === "" ? {} : { language: languageLabelOf(props.file.language) })}
        >
            <HighlightedCode
                code={props.file.content}
                language={props.file.language === "" ? null : props.file.language}
            />
        </FencedCodeBlock>
    </Dialog>
)
