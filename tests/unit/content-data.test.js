import test from 'node:test'
import assert from 'node:assert/strict'

import { contact } from '../../src/data/contact.js'
import { experiences } from '../../src/data/experience.js'
import { profile } from '../../src/data/profile.js'
import { projects } from '../../src/data/projects.js'
import { skillGroups } from '../../src/data/skills.js'

test('profile exports a Chinese-first public homepage position', () => {
  assert.equal(profile.name, '王枭')
  assert.equal(typeof profile.tagline, 'string')
  assert.ok(profile.tagline.includes('产品'))
  assert.ok(profile.tagline.includes('前端') || profile.tagline.includes('做出来'))
  assert.equal(profile.ctaPrimary.href, '#projects')
  assert.equal(profile.ctaPrimary.label, '看我在做的事')
  assert.equal(profile.ctaSecondary.href, '/fitness/')
})

test('content collections stay concise and curated', () => {
  assert.ok(Array.isArray(experiences))
  assert.ok(experiences.length >= 3)
  assert.ok(experiences.length <= 3)

  assert.ok(Array.isArray(projects))
  assert.ok(projects.length >= 3)
  assert.ok(projects.length <= 5)
  assert.ok(projects.some((project) => project.name.includes('3DGS')))

  assert.ok(Array.isArray(skillGroups))
  assert.ok(skillGroups.length >= 3)
})

test('public contact data omits unsafe private fields', () => {
  assert.equal(contact.name, '王枭')
  assert.equal(contact.location, '武汉')
  assert.equal(contact.email, 'wang_xiao_edu@163.com')
  assert.equal(contact.phone, undefined)
  assert.equal(contact.birthDate, undefined)
  assert.equal(contact.politicalAffiliation, undefined)
})
