import { artifactSource } from './artifacts.js'
import { createZip } from './zip.js'
// A small, honest project folder: the exact artifact source plus notes.
export function artifactProjectFiles(artifact, version = artifact.versions.length - 1) {
  const source = artifactSource(artifact, version)
  const isSvg = artifact.type === 'svg'
  const file = isSvg ? 'image.svg' : 'index.html'
  return [
    { name: file, data: source },
    { name: 'artifact.json', data: JSON.stringify({ title: artifact.title, type: artifact.type, version: version + 1, exportedAt: new Date().toISOString(), source: file }, null, 2) + '\n' },
    { name: 'README.md', data: `# ${artifact.title}\n\nGenerated locally by AI ASSistant (version ${version + 1}).\n\nOpen \`${file}\` in a browser to run it.\n\nWarning: this export is NOT sandboxed. Review the source before running it, especially any scripts.\n` },
  ]
}
export function artifactZipBytes(artifact, version) {
  return createZip(artifactProjectFiles(artifact, version))
}
export function safeFileName(title, extension) {
  return `${String(title || 'artifact').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60) || 'artifact'}.${extension}`
}
