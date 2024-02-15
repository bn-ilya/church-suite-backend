
const utils = require('@strapi/utils');
const { getService } = require("@strapi/plugin-users-permissions/server/utils");

const { sanitize } = utils;

const sanitizeOutput = (user, ctx) => {
  const schema = strapi.getModel('plugin::users-permissions.user');
  const { auth } = ctx.state;

  return sanitize.contentAPI.output(user, schema, { auth });
};

module.exports = (plugin) => {

  plugin.controllers.user.create = async (ctx) => {
    const { phone, username } = ctx.request.body;

    if (!phone) return ctx.badRequest('missing.phone');
    
    const userWithThisNumber = await strapi
        .query('plugin::users-permissions.user')
        .findOne({ where: {phone} });
    
    if (userWithThisNumber) {
        return ctx.badRequest(
        null
        );
    }
    
    const code = String(random4Digit());
    
    const user = {
        username,
        email: 'eqxam2ple@example.ru',
        phone,
        provider: 'local',
        code
    };
  
    try {
      const response = await strapi.services['plugin::users-permissions.user'].add(user);
      ctx.created(user);
    } catch (error) {
      ctx.badRequest(null);
    }
  };

  return plugin;
};

function random4Digit(){
  return Math.floor(1000 + Math.random() * 9000);
}

