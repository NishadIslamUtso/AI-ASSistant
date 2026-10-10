import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
export default function Markdown({ children, onExternalLink }) {
  // No raw HTML plugin. Model/page HTML is source data, never app DOM.
  // Model-authored image URLs must not auto-upload private context in a query.
  return <ReactMarkdown remarkPlugins={[remarkGfm]} className="markdown" components={{
    a: ({ node, href, ...props }) => <a {...props} href={href} onClick={event => { event.preventDefault(); if (href && /^https?:\/\//i.test(href)) onExternalLink?.(href); }} />,
    img: ({ alt }) => <span className="blocked-image">[Image not fetched: {alt || 'external image'}]</span>,
  }}>{children}</ReactMarkdown>
}
