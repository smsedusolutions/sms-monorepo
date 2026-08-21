const emailService = require("./emailService");
const placeholderResolver = require("./placeholderResolver");
const emailStyleTemplates = require("./emailStyleTemplates");
const pagination = require("./pagination");

module.exports = {
  ...emailService,
  ...placeholderResolver,
  ...emailStyleTemplates,
  ...pagination,
  ...require("./activityLogger"),
  ...require("./originMatcher"),
  ...require("./idGenerator"),
  ...require("./passwordUtils"),
};
