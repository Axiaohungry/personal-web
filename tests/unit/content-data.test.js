import test from 'node:test'
import assert from 'node:assert/strict'

import { contact } from '../../src/data/contact.js'
import { experiences } from '../../src/data/experience.js'
import { profile } from '../../src/data/profile.js'
import { projects } from '../../src/data/projects.js'
import { skillGroups } from '../../src/data/skills.js'

test('profile exports a public homepage position with stable CTA structure', () => {
  assert.equal(typeof profile.name, 'string')
  assert.ok(profile.name.trim().length > 0)
  assert.equal(typeof profile.tagline, 'string')
  assert.ok(profile.tagline.trim().length >= 20)
  assert.equal(typeof profile.summary, 'string')
  assert.ok(profile.summary.trim().length >= 20)
  assert.equal(profile.ctaPrimary.href, '#projects')
  assert.equal(typeof profile.ctaPrimary.label, 'string')
  assert.equal(profile.ctaSecondary.href, '/fitness/')
  assert.equal(typeof profile.ctaSecondary.label, 'string')
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
  assert.equal(typeof contact.name, 'string')
  assert.equal(typeof contact.location, 'string')
  assert.equal(typeof contact.email, 'string')
  assert.equal(contact.phone, undefined)
  assert.equal(contact.birthDate, undefined)
  assert.equal(contact.politicalAffiliation, undefined)
})
