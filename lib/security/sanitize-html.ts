import DOMPurify from "isomorphic-dompurify"

const CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "em", "b", "i", "u",
    "ul", "ol", "li",
    "a", "span", "div",
    "h1", "h2", "h3", "h4",
    "blockquote", "code", "pre",
  ] as string[],
  ALLOWED_ATTR: ["href", "title"] as string[],
  ALLOWED_URI_REGEXP: /^(https?:|mailto:|tel:)/i,
}

export function sanitizeHtml(input: string): string {
  if (!input) return ""
  return DOMPurify.sanitize(input, CONFIG)
}
