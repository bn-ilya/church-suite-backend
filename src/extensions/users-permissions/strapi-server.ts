import {  } from "./external-api";
const {sendVoiceCode} = require("./external-api"); 
const utils = require('@strapi/utils');

const { sanitize } = utils;

// const sanitizeOutput = (user, ctx) => {
//   const schema = strapi.getModel('plugin::users-permissions.user');
//   const { auth } = ctx.state;

//   return sanitize.contentAPI.output(user, schema, { auth });
// };

module.exports = (plugin) => {

  plugin.controllers.user.create = async (ctx) => {
    const { phone, username } = ctx.request.body;

    if (!phone) return ctx.badRequest('missing.phone');
    
    const userWithThisNumber = await strapi
        .query('plugin::users-permissions.user')
        .findOne({ where: {phone} });
    
    if (userWithThisNumber) {
        return ctx.badRequest(
          "Такой пользователь уже существует"
        );
    }
    
    const code = String(random4Digit());
    
    const user = {
        username,
        email: 'eqxample@example.ru',
        phone,
        provider: 'local',
        code
    };
  
    const response = {
      username,
      phone
    }

    try {
      await strapi.services['plugin::users-permissions.user'].add(user);
      await sendVoiceCode(code);
      ctx.created(response);
    } catch (error) {
      ctx.badRequest(error);
    }
  };

  return plugin;
};

function random4Digit(){
  return Math.floor(1000 + Math.random() * 9000);
}

