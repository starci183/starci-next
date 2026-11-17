import { Stack } from "@starci/grammar/common"
import { EssentialPartIntro, EssentialScenarios } from "@starci-next/ui"
import { APP_ROUTES } from "@/modules/routes"
import { PrimaryAction } from "./PrimaryAction"
import type { PartLayoutOf } from "../layout"

/** Kịch bản: the scenarios run on the learner's machine; the primary is run, check again or the next scenario. */
export const scenariosLayout: PartLayoutOf = ({ lesson, screen, isLoading }) => {
    const { labels, primary } = screen.props.runs
    return {
        main: (
            <Stack gap="region">
                <EssentialScenarios
                    part={lesson.scenarios}
                    labels={labels.scenarios}
                    connectHref={APP_ROUTES.connect}
                    isLoading={isLoading}
                    onSelect={screen.on.selectScenario}
                    onGuard={screen.on.toggleGuard}
                    onReveal={screen.on.revealHint}
                    onCopy={(text) => void navigator.clipboard.writeText(text)}
                />
                {lesson.intro === undefined ? null : (
                    <EssentialPartIntro section={lesson.intro} labels={screen.props.labels} />
                )}
            </Stack>
        ),
        aside: undefined,
        action: <PrimaryAction primary={primary} />,
    }
}
