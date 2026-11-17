"use client"

import { useTranslations } from "next-intl"
import { APP_ROUTES } from "@/modules/routes"
import type { ProjectDetailLabels } from "@/modules/types"

/** The fixed words of the project page, from the catalogue of the active language. */
export const useProjectDetailLabels = (): ProjectDetailLabels => {
    const t = useTranslations("app.projects")
    return {
        pageTitle: t("pageTitle"),
        pageHref: APP_ROUTES.projects,
        breadcrumbs: t("detail.breadcrumbs"),
        experienceHref: APP_ROUTES.experience,
        devicesHref: APP_ROUTES.devices,
        notFound: t("detail.notFound"),
        notFoundText: t("detail.notFoundText"),
        back: t("detail.back"),
        noRepo: t("detail.noRepo"),
        milestones: t("detail.milestones"),
        emptyMilestones: t("detail.milestonesEmpty"),
        runsTitle: t("detail.runsTitle"),
        colKind: t("detail.colKind"),
        colDetail: t("detail.colDetail"),
        colResult: t("detail.colResult"),
        colAt: t("detail.colAt"),
        runsEmpty: t("detail.runsEmpty"),
        expTitle: t("detail.expTitle"),
        expLink: t("detail.expLink"),
        expEmpty: t("detail.expEmpty"),
        probesTitle: t("detail.probesTitle"),
        deployTitle: t("detail.deployTitle"),
        deployText: t("detail.probeText"),
        deployedLabel: t("detail.deployedLabel"),
        saveDeployed: t("detail.saveDeployed"),
        runProbes: t("detail.runProbes"),
        runningProbes: t("detail.runningProbes"),
        sync: t("detail.sync"),
        syncing: t("detail.syncing"),
        asideRepo: t("detail.asideRepo"),
        asideCi: t("detail.asideCi"),
        ciNote: t("detail.ciAttestNote"),
        deviceTitle: t("device.title"),
        deviceBadge: t("device.badge"),
        deviceNote: t("detail.deviceNote"),
        deviceConnect: t("detail.deviceConnect"),
        secretTitle: t("detail.secretAside"),
        secretText: t("detail.secretText"),
        rotate: t("detail.rotate"),
        rotating: t("detail.rotating"),
        newSecret: t("detail.newSecret"),
        copy: t("new.copy"),
        copied: t("new.copied"),
        layoutTitle: t("detail.layoutAside"),
        layoutTree: t("detail.layoutTree"),
        layoutTests: t("detail.layoutTests"),
        layoutTestsText: t("detail.layoutTestsText"),
        layoutFlow: t("detail.layoutFlow"),
    }
}
