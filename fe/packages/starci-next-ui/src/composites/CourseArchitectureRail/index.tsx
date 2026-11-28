import { Button, Section, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** One fact of the architecture: its name and its value (`Kiểu` · `Microservices, mỗi service một database riêng`). */
export type CourseArchitectureFactView = {
    readonly id: string
    readonly label: string
    readonly value: string
}

/** One running part of the lab: a service (`Order Service`, `:4001 · Express · database orders`) or a dependency (`PostgreSQL`). */
export type CourseArchitecturePartView = {
    readonly id: string
    readonly title: string
    readonly description: string
}

/**
 * What the rail of the Kiến trúc page shows (owner 2026-11-28: "đừng ghi bài lab trên máy bạn, ghi rõ kiểu kiến trúc"): the system itself,
 * never the lab card again (the intro already has it): its kind and how its parts talk, the services and what runs under them, and the
 * one command that leads on.
 */
export type CourseArchitectureRailView = {
    readonly title: string
    readonly facts: ReadonlyArray<CourseArchitectureFactView>
    readonly servicesTitle: string
    readonly services: ReadonlyArray<CourseArchitecturePartView>
    readonly depsTitle: string
    readonly deps: ReadonlyArray<CourseArchitecturePartView>
    /** The command to the page after this one (`Sang Happy path`); empty draws no button. */
    readonly next: string
    /** The line under the command; empty draws none. */
    readonly caption: string
}

/** What the rail needs: its view, the loading flag and what the command does. */
type CourseArchitectureRailProps = {
    readonly view: CourseArchitectureRailView
    readonly isLoading?: boolean
    readonly onNext: () => void
}

/**
 * COMPOSITE - the rail of the Kiến trúc page: one card named for the system, its facts as key and value rows (kind, how the parts talk,
 * language and where it runs), then the services and the infrastructure under them as rows, then the command to the normal cases.
 */
export const CourseArchitectureRail = (props: CourseArchitectureRailProps) => {
    const { view } = props
    const isLoading = props.isLoading === true
    return (
        <SurfaceCard label={view.title} headingLevel={2} isLoading={isLoading}>
            <Stack gap="section">
                <Section
                    kind="list"
                    layout="keyValue"
                    ariaLabel={view.title}
                    isLoading={isLoading}
                    empty=""
                    items={view.facts.map((fact) => ({ id: fact.id, title: fact.label, value: fact.value }))}
                />
                <Section
                    kind="list"
                    title={view.servicesTitle}
                    headingLevel={3}
                    isLoading={isLoading}
                    empty=""
                    items={view.services.map((part) => ({ id: part.id, title: part.title, description: part.description }))}
                />
                {view.deps.length === 0 ? null : (
                    <Section
                        kind="list"
                        title={view.depsTitle}
                        headingLevel={3}
                        isLoading={isLoading}
                        empty=""
                        items={view.deps.map((part) => ({ id: part.id, title: part.title, description: part.description }))}
                    />
                )}
                {view.next === "" ? null : (
                    <Stack gap="identity" align="start">
                        <Button variant="primary" onPress={props.onNext}>
                            {view.next}
                        </Button>
                        {view.caption === "" ? null : (
                            <Text role="caption" tone="muted">
                                {view.caption}
                            </Text>
                        )}
                    </Stack>
                )}
            </Stack>
        </SurfaceCard>
    )
}
