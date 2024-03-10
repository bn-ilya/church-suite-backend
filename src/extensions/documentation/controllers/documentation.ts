'use strict';
const fs = require('fs-extra');
const path = require('path');
module.exports = {
  async openapi(ctx) {
    try {
      const { major, minor, patch } = ctx.params;
      const version =
        major && minor && patch ? `${major}.${minor}.${patch}` : strapi.plugins.documentation.config('info.version');
      const openAPISpecsPath = path.join(
        strapi.dirs.app.src,
        'extensions',
        'documentation',
        'documentation',
        version,
        'full_documentation.json'
      );
      const documentation = fs.readFileSync(openAPISpecsPath, 'utf8');
      const response = JSON.parse(documentation);
      ctx.send(response);
    } catch (e) {
      strapi.log.error(e);
      ctx.badRequest(null, e.message);
    }
  }
};