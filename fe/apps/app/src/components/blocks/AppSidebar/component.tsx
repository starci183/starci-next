import { Cluster, DropdownMenu, IconButton, Sidebar, Switch, type SidebarGroup } from "@starci/grammar/common"
import { CollapseGlyph, LanguageGlyph, languageMenuEntries, MoonGlyph, SunGlyph } from "@starci-next/ui"
import type { AppSidebarBaseProps } from "./types"

export type * from "./types"

/** Draws the white sidebar as the NIVO console sidebar (ConsoleSidebar): the collapse button, the destinations in their groups with the current one marked (navigation only, no footer: the plan lives in the top bar); the drawer carries the language and theme controls above the groups. */
export const AppSidebarBase = (props: AppSidebarBaseProps) => {
    const { collapse, controls } = props.props
    const groups: ReadonlyArray<SidebarGroup> = props.props.groups.map((group) => ({
        id: group.id,
        ...(group.label === undefined ? {} : { label: group.label }),
        items: group.items,
    }))
    return (
        <Sidebar
            label={props.props.label}
            groups={groups}
            presentation={props.props.presentation}
            {...(props.props.selectedKey === undefined ? {} : { selectedKey: props.props.selectedKey })}
            {...(controls === undefined
                ? {}
                : {
                      header: (
                          <Cluster gap="inline" wrap={false}>
                              <DropdownMenu
                                  placement="bottom end"
                                  entries={languageMenuEntries({
                                      label: controls.languageLabel,
                                      value: controls.locale,
                                      options: controls.localeOptions,
                                      isDisabled: controls.isLocalePending,
                                      onChange: controls.onChooseLocale,
                                  })}
                                  trigger={
                                      <IconButton
                                          source={LanguageGlyph}
                                          label={controls.languageLabel}
                                          intent="dismiss"
                                          isDisabled={controls.isLocalePending}
                                      />
                                  }
                              />
                              <Switch
                                  label={controls.themeLabel}
                                  isLabelHidden
                                  size="control"
                                  isSelected={controls.isDark}
                                  onSelectedChange={controls.onChooseDark}
                                  thumbIcon={SunGlyph}
                                  selectedThumbIcon={MoonGlyph}
                              />
                          </Cluster>
                      ),
                  })}
            {...(collapse === undefined
                ? {}
                : {
                      isCollapsed: collapse.isCollapsed,
                      collapseLabel: collapse.collapseLabel,
                      expandLabel: collapse.expandLabel,
                      toggleSource: CollapseGlyph,
                      onCollapsedChange: collapse.onChange,
                  })}
            onAction={props.on.go}
        />
    )
}
