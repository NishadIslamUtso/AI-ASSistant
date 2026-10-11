import { useMemo } from 'react'
import { artifactSource, buildPreviewHtml } from '../lib/artifacts.js'

export default function ArtifactInlinePreview({ artifact }) {
  const source = artifactSource(artifact)
  const html = useMemo(() => buildPreviewHtml(source, `inline-${artifact.id}`), [source, artifact.id])
  return <div className="artifact-inline-preview">
    <iframe
      title={`Inline artifact preview: ${artifact.title}`}
      srcDoc={html}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  </div>
}
