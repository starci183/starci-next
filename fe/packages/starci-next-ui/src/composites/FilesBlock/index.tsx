import { FilesCard } from "../FilesCard"
import type { CardEnv, StudyCardView } from "../StudyBody/types"

/** What the files block needs: its card and the environment. */
type FilesBlockProps = { readonly card: Extract<StudyCardView, { kind: "files" }>; readonly env: CardEnv }

/** The files of a lab or an exercise, with the language switch when the lab ships several. */
export const FilesBlock = (props: FilesBlockProps) => {
    const { card, env } = props
    return (
        <FilesCard
            label={env.labels.filesLabel}
            files={card.files}
            openLabel={env.labels.filesOpen}
            copyLabel={env.labels.markdown.copy ?? "Copy"}
            copiedLabel={env.labels.markdown.copied ?? "Copied"}
            closeLabel={env.labels.filesClose}
            {...(card.downloadHref === undefined || card.downloadLanguage === undefined
                ? {}
                : { downloadHref: card.downloadHref, downloadLabel: env.labels.filesDownload(card.downloadLanguage) })}
            {...(card.variants === undefined
                ? {}
                : {
                      variants: card.variants.map((variant) => ({
                          ...variant,
                          ...(variant.downloadHref === undefined
                              ? {}
                              : { downloadLabel: env.labels.filesDownload(variant.label) }),
                      })),
                      variantLabel: env.labels.languageLabel,
                      variant: card.selectedVariant ?? "typescript",
                      onVariant: env.on.pickLanguage,
                  })}
        />
    )
}
