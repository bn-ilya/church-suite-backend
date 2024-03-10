'use strict';
const restrictAccess = require('@strapi/plugin-documentation/server/middlewares/restrict-access');
/**
 * company router.
 */
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/  ',
      handler: 'documentation.openapi',
      config: {
        auth: false,
        middlewares: [restrictAccess]
      }
    },
    {
      method: 'GET',
      path: '/v:major(\\d+).:minor(\\d+).:patch(\\d+)/openapi.json',
      handler: 'documentation.openapi',
      config: {
        auth: false,
        middlewares: [restrictAccess]
      }
    }
  ]
};