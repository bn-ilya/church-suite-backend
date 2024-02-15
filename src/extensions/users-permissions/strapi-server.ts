const {transliterate} = require("transliteration");
const {sendVoiceCode} = require("./external-api"); 
const utils = require('@strapi/utils');

const { sanitize } = utils;

async function generateUniqueUsername(username: string, index = 0) {
  const userWithThisUsername = await strapi
  .query('plugin::users-permissions.user')
  .findOne({ where: {username: username + (index || '')} });

  if (userWithThisUsername) return await generateUniqueUsername(username, index + 1);
  return username + index;
}

module.exports = (plugin) => {
  plugin.controllers.user.create = async (ctx) => {
    const { phone, name } = ctx.request.body;

    if (!phone) return ctx.badRequest('Введите номер телефона');
    if (!name) return ctx.badRequest('Введите имя и фамилию');
    
    const userWithThisNumber = await strapi
        .query('plugin::users-permissions.user')
        .findOne({ where: {phone} });
    
    if (userWithThisNumber) {
        return ctx.badRequest(
          "Пользователь с таким номером уже существует"
        );
    }

    const username = await generateUniqueUsername(transliterate(name));
    const code = String(random4Digit());
    
    const user = {
        name,
        username,
        email: 'eqxample@example.ru',
        phone,
        provider: 'local',
        code
    };
  
    const response = {
      name,
      username,
      phone
    }

    try {
      await strapi.services['plugin::users-permissions.user'].add(user);
      // await sendVoiceCode(code, +79284131458);
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

