import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  approvalStaticCatalog,
  approvalCatalogStats,
} from '../../src/views/government-approval/data/approvalPageCatalog.js'
import {
  evaluateStaticCondition,
  extractConditionOptionValues,
} from '../../src/views/government-approval/utils/staticCondition.js'

const routerPath = new URL('../../src/router/index.js', import.meta.url)
const projectViewPath = new URL('../../src/views/projects/ProjectApprovalMapWorkflowView.vue', import.meta.url)
const catalogPath = new URL('../../src/views/government-approval/data/approvalPageCatalog.js', import.meta.url)
const staticPagesViewPath = new URL(
  '../../src/views/government-approval/GovernmentApprovalStaticPagesView.vue',
  import.meta.url
)

test('government approval static pages are wired into routing and the project case page', async () => {
  const [routerFile, projectViewFile, catalogFile, staticPagesViewFile] = await Promise.all([
    readFile(routerPath, 'utf8'),
    readFile(projectViewPath, 'utf8'),
    readFile(catalogPath, 'utf8'),
    readFile(staticPagesViewPath, 'utf8'),
  ])
  const previewFile = await readFile(new URL('../../src/views/government-approval/components/PagePreview.vue', import.meta.url), 'utf8')

  assert.ok(routerFile.includes("path: '/projects/approval-map-workflow/static-pages'"))
  assert.ok(routerFile.includes("alias: ['/projects/approval-map-workflow/static-pages/']"))
  assert.ok(routerFile.includes("name: 'project-approval-map-workflow-static-pages'"))
  assert.ok(
    routerFile.includes("component: () => import('@/views/government-approval/GovernmentApprovalStaticPagesView.vue')")
  )

  assert.ok(projectViewFile.includes('/projects/approval-map-workflow/static-pages'))
  assert.ok(projectViewFile.includes('查看静态页面解析'))
  assert.ok(projectViewFile.includes('因保密原因，只能展示模拟静态前端页面'))

  assert.ok(catalogFile.includes('approvalStaticCatalog'))
  assert.ok(catalogFile.includes('matterPages'))

  assert.ok(staticPagesViewFile.includes('approvalStaticCatalog'))
  assert.ok(staticPagesViewFile.includes('matterPages'))
  assert.ok(staticPagesViewFile.includes('PagePreview'))
  assert.ok(staticPagesViewFile.includes('事项页面列表'))
  assert.ok(!staticPagesViewFile.includes('通用表单'))
  assert.ok(!staticPagesViewFile.includes('后台系统'))
  assert.ok(!staticPagesViewFile.includes('来源文件'))
  assert.ok(!previewFile.includes('来源文件'))
  assert.ok(!previewFile.includes('数据表'))
  assert.ok(!previewFile.includes('子表单'))
})

test('government approval static catalog keeps parsed matter page coverage', () => {
  assert.equal(approvalStaticCatalog.matterPages.length, 36)
  assert.equal(approvalCatalogStats.mappedMatterCount, 36)
  assert.equal(approvalCatalogStats.unmappedMatterCount, 0)

  for (const page of approvalStaticCatalog.matterPages) {
    assert.ok(page.sourceFiles.length > 0, `${page.title} should keep at least one source file`)
    assert.ok(page.preview.fields.length > 0, `${page.title} should expose fields for static rebuild`)
    assert.ok(page.rebuildSections?.length > 0, `${page.title} should keep original project form sections`)
    assert.ok(page.category.length > 0)
    assert.ok(!page.category.includes('?'), `${page.title} category should be readable Chinese text`)
  }
})

test('government approval static rebuild uses original project form sections and styling hooks', async () => {
  const previewFile = await readFile(
    new URL('../../src/views/government-approval/components/PagePreview.vue', import.meta.url),
    'utf8'
  )
  const locationApproval = approvalStaticCatalog.matterPages.find((page) => page.formCode === 'locationApproval')
  const sectionNames = locationApproval.rebuildSections.map((section) => section.name)

  assert.ok(sectionNames.includes('项目基本信息'))
  assert.ok(sectionNames.includes('规划选址信息'))
  assert.ok(sectionNames.includes('土地利用现状信息'))
  assert.ok(sectionNames.includes('核查文件信息'))
  assert.ok(previewFile.includes('cici-form-css'))
  assert.ok(previewFile.includes('matter-form-preview__section-title--title-css4'))
  assert.ok(previewFile.includes('matter-form-preview__radio-option'))
  assert.ok(previewFile.includes('matter-form-preview__select-arrow'))
  assert.ok(previewFile.includes('matter-form-preview__calendar-icon'))
  assert.ok(previewFile.includes('--field-span'))
  assert.ok(!previewFile.includes("const sectionNames = ['基本信息'"))
})

test('government approval static page uses full-width layout and live ant controls', async () => {
  const [mainFile, previewFile, appEntry] = await Promise.all([
    readFile(staticPagesViewPath, 'utf8'),
    readFile(new URL('../../src/views/government-approval/components/PagePreview.vue', import.meta.url), 'utf8'),
    readFile(new URL('../../src/main.js', import.meta.url), 'utf8'),
  ])

  assert.ok(mainFile.includes('max-width: none'))
  assert.ok(mainFile.includes('width: 100%'))
  assert.ok(appEntry.includes('DatePicker'))
  assert.ok(appEntry.includes('Radio'))
  assert.ok(previewFile.includes('<a-input'))
  assert.ok(previewFile.includes('<a-select'))
  assert.ok(previewFile.includes('<a-date-picker'))
  assert.ok(previewFile.includes('<a-input-number'))
  assert.ok(previewFile.includes('<a-textarea'))
  assert.ok(previewFile.includes('<a-radio-group'))
  assert.ok(previewFile.includes('placeholderFor(field)'))
  assert.ok(previewFile.includes('dictOptionsFor(field)'))
  assert.ok(!previewFile.includes("value: '符合'"))
  assert.ok(!previewFile.includes("value: '不涉及'"))
  assert.ok(previewFile.includes('该项为必填'))
  assert.ok(previewFile.includes('show-count'))
  assert.ok(previewFile.includes('maxlength'))
})

test('government approval static rebuild keeps original ant grid spans', () => {
  const locationApproval = approvalStaticCatalog.matterPages.find((page) => page.formCode === 'locationApproval')
  const fields = locationApproval.rebuildSections.flatMap((section) => section.fields)
  const projectName = fields.find((field) => field.label === '项目名称')
  const projectCode = fields.find((field) => field.label === '项目代码')
  const approvalType = fields.find((field) => field.label === '批准类型')
  const situation = fields.find((field) => field.writeField === 'BW_PROGRAM_LOCATION.LOCATION_APPROVAL_LEVEL_CODE')
  const stage = fields.find((field) => field.label === '预审办理阶段')
  const surveyYear = fields.find((field) => field.label === '调查现状年份')
  const checkedArea = fields.find((field) => field.label === '拟用地总面积')
  const buildArea = fields.find((field) => field.label === '建设用地')
  const landUseDesc = fields.find((field) => field.label === '功能区分用地情况')
  const basisRemark = fields.find((field) => field.label === '项目建设依据说明')
  const locationRequire = fields.find((field) => field.label === '选址要求(补充信息)')

  assert.equal(projectName.span, 8)
  assert.equal(projectName.disabled, 'disabled')
  assert.equal(projectCode.placeholder, '全国投资项目统一代码')
  assert.equal(approvalType.dictCode, 'xmpzlx')
  assert.equal(situation.dictCode, 'xzxkjb')
  assert.ok(stage.vIf.includes("LOCATION_APPROVAL_LEVEL_CODE=='4'"))
  assert.equal(surveyYear.span, 12)
  assert.equal(checkedArea.addonAfter, 'm²')
  assert.equal(checkedArea.precision, 2)
  assert.equal(buildArea.span, 6)
  assert.equal(landUseDesc.layout, 'vertical')
  assert.equal(landUseDesc.labelAlign, 'top')
  assert.equal(basisRemark.rows, 4)
  assert.equal(basisRemark.maxlength, 8000)
  assert.equal(basisRemark.layout, 'horizontal')
  assert.equal(basisRemark.labelAlign, 'left')
  assert.equal(locationRequire.rows, 8)
})

test('government approval static rebuild renders conditional and disabled hints without dict code prefixes', async () => {
  const previewFile = await readFile(
    new URL('../../src/views/government-approval/components/PagePreview.vue', import.meta.url),
    'utf8'
  )

  assert.ok(previewFile.includes('isFieldDisabled(field)'))
  assert.ok(previewFile.includes('visibleSections'))
  assert.ok(previewFile.includes('evaluateStaticCondition(field.vIf'))
  assert.ok(previewFile.includes('matter-form-preview__field--vertical'))
  assert.ok(previewFile.includes("label: `选项${index + 1}`"))
  assert.ok(!previewFile.includes('`${field.dictCode} 选项一`'))
  assert.ok(!previewFile.includes('显示条件：'))
})

test('government approval static v-if conditions evaluate against local form values', () => {
  const levelCondition = "viewData?.BW_PROGRAM_LOCATION?.LOCATION_APPROVAL_LEVEL_CODE=='4'"
  const itemTypeCondition = "viewData?.BW_PROGRAM_LOCATION?.ITEM_TYPE_CODE!='0'"

  assert.equal(
    evaluateStaticCondition(levelCondition, {
      'BW_PROGRAM_LOCATION.LOCATION_APPROVAL_LEVEL_CODE': '4',
    }),
    true
  )
  assert.equal(
    evaluateStaticCondition(levelCondition, {
      'BW_PROGRAM_LOCATION.LOCATION_APPROVAL_LEVEL_CODE': '2',
    }),
    false
  )
  assert.equal(
    evaluateStaticCondition(itemTypeCondition, {
      'BW_PROGRAM_LOCATION.ITEM_TYPE_CODE': '1',
    }),
    true
  )
  assert.equal(
    evaluateStaticCondition(itemTypeCondition, {
      'BW_PROGRAM_LOCATION.ITEM_TYPE_CODE': '0',
    }),
    false
  )
  assert.deepEqual(extractConditionOptionValues('BW_PROGRAM_LOCATION.LOCATION_APPROVAL_LEVEL_CODE', [levelCondition]), ['4'])
  assert.deepEqual(extractConditionOptionValues('BW_PROGRAM_LOCATION.ITEM_TYPE_CODE', [itemTypeCondition]), ['0', '1'])
})
