import type { SkillDefinition, UseMessagePlugin } from '@opentiny/tiny-robot-kit'
import { loadSkillWithDetails, skillPlugin } from '@opentiny/tiny-robot-kit'
import { getMainSkillPaths, getSkillMdContent } from '@opentiny/next-sdk'
import type { Ref } from 'vue'

const SKILL_ENTRY_FILE = 'SKILL.md'

const skillModules = import.meta.glob('../../skills/**/SKILL.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

async function parseSkillDefinition(raw: string): Promise<SkillDefinition> {
  if (typeof File === 'undefined') {
    throw new Error('File is not available in the current environment')
  }
  const entry = new File([raw], SKILL_ENTRY_FILE, { type: 'text/markdown' })
  const { skill, warnings } = await loadSkillWithDetails({ source: 'browser', fileList: [entry] })
  if (warnings.length > 0) {
    console.warn('[tiny-robot-chat] business skill warnings', warnings)
  }
  return skill
}

export async function loadBusinessSkills(): Promise<SkillDefinition[]> {
  const paths = await getMainSkillPaths(skillModules)
  const loaded = await Promise.all(
    paths.map(async (path) => {
      const raw = await getSkillMdContent(skillModules, path)
      if (!raw) return undefined
      try {
        return await parseSkillDefinition(raw)
      } catch (error) {
        console.warn(`[tiny-robot-chat] failed to load business skill ${path}`, error)
        return undefined
      }
    }),
  )

  return loaded.filter((skill): skill is SkillDefinition => Boolean(skill))
}

export function createBusinessSkillPlugin(skills: Ref<SkillDefinition[]>): UseMessagePlugin {
  return skillPlugin({
    selection: () => ({ mode: 'manual', skills: skills.value }),
  })
}
