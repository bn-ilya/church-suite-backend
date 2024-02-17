const {transliterate} = require("transliteration");
import { edit } from './../../../dist/build/2089.383b46c5.chunk';
const {sendVoiceCode} = require("./external-api"); 
const utils = require('@strapi/utils');

const { sanitize } = utils;

const sanitizeOutput = (user, ctx) => {
  const schema = strapi.getModel('plugin::users-permissions.user');
  const { auth } = ctx.state;

  return sanitize.contentAPI.output(user, schema, { auth });
};

async function generateUniqueUsername(username: string, index = 0) {
  const userWithThisUsername = await strapi
  .query('plugin::users-permissions.user')
  .findOne({ where: {username: username + index} });

  if (userWithThisUsername) return await generateUniqueUsername(username, index + 1);
  return username + index;
}

module.exports = (plugin) => {
  plugin.controllers.user.me = async (ctx) => {
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized();
    }

    
    const lcForm = await strapi
    .query('api::live-chat-client.live-chat-client')
    .findOne({ where: {id: user["lc_form_id"]} });

    if (lcForm) {
      user.lcForm = lcForm;
    }

    ctx.body = await sanitizeOutput(user, ctx);
  }
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
        code,
        role: undefined
    };

    const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' });
    const settings: any = await pluginStore.get({ key: 'advanced' });

    const role = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: settings.default_role } });

    user.role = role.id;

    const response = {
      name,
      username,
      phone
    }

    try {
      await strapi.services['plugin::users-permissions.user'].add(user);
      await sendVoiceCode(code, +79284131458);
      ctx.created(response);
    } catch (error) {
      ctx.badRequest(error);
    }
  };
  
  plugin.controllers.user.verifyAccount = async (ctx) => {
    const { phone, code } = ctx.request.body;

    const verifyUser = await strapi
    .query('plugin::users-permissions.user')
    .findOne({ where: {phone, code} });

    if (!verifyUser) {
      return ctx.badRequest(
        "Неверный код подтверждения"
      );
    }

    let updateData = {
      code: '',
      confirmed: true
    };

    const data = await strapi.plugins['users-permissions'].services.user.edit(verifyUser.id, updateData);
    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: data.id,
    })

    ctx.send({ jwt, user: data });
  };

  plugin.controllers.user.login = async (ctx) => {
    const {phone, channel} = ctx.request.body;

    const user = await strapi
    .query('plugin::users-permissions.user')
    .findOne({ where: {phone} });

    if (!user) {
        return ctx.badRequest(
          "Пользователя с таким номером не существует"
        );
    }
    const code = String(random4Digit());

    let updateData = {
      code
    };

    const response = {
      status: 'send'
    }

    try {
      await strapi.plugins['users-permissions'].services.user.edit(user.id, updateData);
      await sendVoiceCode(code, "+79284131458");
      ctx.created(response);
    } catch (error) {
      ctx.badRequest(error);
    }
  }
  
  plugin.routes["content-api"].routes = [...plugin.routes["content-api"].routes, 
    {
      method: "POST",
      path: "/verify",
      handler: "user.verifyAccount",
    },
    {
      method: "POST",
      path: "/login",
      handler: "user.login",
    },
  ];

  return plugin;
};

function random4Digit(){
  return Math.floor(1000 + Math.random() * 9000);
}

