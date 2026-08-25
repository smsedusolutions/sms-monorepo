const emailService = require("./emailService");
const placeholderResolver = require("./placeholderResolver");
const emailStyleTemplates = require("./emailStyleTemplates");
const pagination = require("./pagination");

/**
 * SECURITY (ReDoS): Escape special regex metacharacters in a user-supplied string
 * before passing it to `new RegExp()`. Without this, an attacker can craft a string
 * like `(a+)+$` that causes catastrophic backtracking and blocks the event loop.
 *
 * @param {string} str - Raw user input
 * @returns {string} - Escaped string safe for use in RegExp constructor
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = {
  ...emailService,
  ...placeholderResolver,
  ...emailStyleTemplates,
  ...pagination,
  ...require("./activityLogger"),
  ...require("./originMatcher"),
  ...require("./corsConfig"),
  ...require("./htmlSanitizer"),
  ...require("./idGenerator"),
  ...require("./passwordUtils"),
  escapeRegex,
};
