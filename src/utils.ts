import { parse } from "fast-html-parser";
import sanitize from "sanitize-html";

export const querySelector = (html: string, query: string) => {
  const sanitizedHtml = sanitize(html, {
    allowedTags: ["section", "div", "svg"],
    allowedAttributes: {
      "*": ["id", "class"],
    },
  });
  const root = parse(sanitizedHtml);
  return root.querySelector(query);
};
