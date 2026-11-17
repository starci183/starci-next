import { Stack } from "@starci/grammar/common"
import { EssentialPartIntro, EssentialSource, EssentialSourceAside, EssentialSourceDownload } from "@starci-next/ui"
import type { PartLayoutOf } from "../layout"

/** Source: the machine and the pull commands, the architecture, the rule each component keeps and the code walk; the archive is the primary. */
export const sourceLayout: PartLayoutOf = ({ lesson, screen, isLoading }) => {
    const { labels } = screen.props.runs
    return {
        main: (
            <Stack gap="region">
                <EssentialSource
                    source={lesson.source}
                    labels={labels.source}
                    isLoading={isLoading}
                    onCopy={(text) => void navigator.clipboard.writeText(text)}
                />
                {lesson.intro === undefined ? null : (
                    <EssentialPartIntro section={lesson.intro} labels={screen.props.labels} />
                )}
            </Stack>
        ),
        aside: <EssentialSourceAside source={lesson.source} labels={labels.source} />,
        action: <EssentialSourceDownload href={lesson.source.downloadHref} label={labels.primary.download} />,
    }
}
