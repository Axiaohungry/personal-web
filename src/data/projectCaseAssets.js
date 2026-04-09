const assetUrl = (relativePath) => new URL(relativePath, import.meta.url).href

export const approvalMapWorkflowAssets = {
  painpointFlow: assetUrl('../assets/projects/approval-map-workflow/painpoint-flow.png'),
  formMapUnifiedUi: assetUrl('../assets/projects/approval-map-workflow/form-map-unified-ui.png'),
  acceptanceFragment: assetUrl('../assets/projects/approval-map-workflow/acceptance-fragment.png'),
}

export const campusCollaborationAssets = {
  panoramicRiskMatrix: assetUrl('../assets/projects/campus-collaboration/全景统筹与风险矩阵.png'),
  gridCoordination: assetUrl('../assets/projects/campus-collaboration/网格化编队与双轨协同.png'),
  sopLanding: assetUrl('../assets/projects/campus-collaboration/SOP落地与现场核验.png'),
  retrospectivePackaging: assetUrl('../assets/projects/campus-collaboration/复盘封装与知识库沉淀.png'),
}

export const fitnessCoachingAssets = {
  goalBreakdownFlow: assetUrl('../assets/projects/fitness-coaching/目标拆解流程图.png'),
  trainingVolumePlan: assetUrl('../assets/projects/fitness-coaching/训练容量计划片段.png'),
  weeklyReviewTracking: assetUrl('../assets/projects/fitness-coaching/周度复盘跟踪片段.png'),
}
