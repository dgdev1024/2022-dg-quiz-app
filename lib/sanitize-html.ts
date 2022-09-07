/**
 * @file lib/sanitize-html.ts
 */

import sanitizeHtml from "sanitize-html";

const sanitizeConfig: sanitizeHtml.IOptions = {
  allowedAttributes: {},
  allowedClasses: {},
  allowedTags: ["strong", "em"],
};

const scrubConfig: sanitizeHtml.IOptions = {
  allowedAttributes: {},
  allowedClasses: {},
  allowedTags: [],
};

export const sanitizeHtmlString = (htmlString: string): string =>
  sanitizeHtml(htmlString, sanitizeConfig);

export const scrubHtmlString = (htmlString: string): string =>
  sanitizeHtml(htmlString, scrubConfig);
