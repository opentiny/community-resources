import { lstat, mkdir, readlink, symlink, unlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = path.join(projectDir, '.agents', 'skills')
const linkPaths = [
  path.join(projectDir, '.claude', 'skills'),
  path.join(projectDir, '.codeartsdoer', 'skills'),
]

async function pathInfo(targetPath) {
  try {
    return await lstat(targetPath)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

async function linkPointsToSource(linkPath) {
  try {
    const target = await readlink(linkPath)
    return path.resolve(path.dirname(linkPath), target) === sourceDir
  } catch (error) {
    if (error.code === 'EINVAL' || error.code === 'UNKNOWN') return false
    throw error
  }
}

async function createSkillLink(linkPath) {
  await mkdir(path.dirname(linkPath), { recursive: true })

  const info = await pathInfo(linkPath)
  if (info) {
    if (!info.isSymbolicLink()) {
      throw new Error(`Refusing to replace non-link path: ${linkPath}`)
    }
    if (await linkPointsToSource(linkPath)) {
      console.log(`Skill link already configured: ${path.relative(projectDir, linkPath)}`)
      return
    }
    await unlink(linkPath)
  }

  const target = process.platform === 'win32'
    ? sourceDir
    : path.relative(path.dirname(linkPath), sourceDir)
  const type = process.platform === 'win32' ? 'junction' : 'dir'

  await symlink(target, linkPath, type)
  console.log(`Created skill link: ${path.relative(projectDir, linkPath)} -> .agents/skills`)
}

const sourceInfo = await pathInfo(sourceDir)
if (!sourceInfo?.isDirectory()) {
  throw new Error(`Skills source directory does not exist: ${sourceDir}`)
}

for (const linkPath of linkPaths) {
  await createSkillLink(linkPath)
}
