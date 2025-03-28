import { isDevelopMode } from "../../flags";
import { sendSmsCode } from "./external-api/api";

const {transliterate} = require("transliteration");
const {sendVoiceCode} = require("./external-api"); 
const utils = require('@strapi/utils');


const { sanitize, validate } = utils;

const validateQuery = async (query, ctx) => {
  const schema = strapi.getModel('plugin::users-permissions.user');
  const { auth } = ctx.state;

  return validate.contentAPI.query(query, schema, { auth });
};

const sanitizeOutput = (user, ctx) => {
  const schema = strapi.getModel('plugin::users-permissions.user');
  const { auth } = ctx.state;

  return sanitize.contentAPI.output(user, schema, { auth });
};

const sanitizeQuery = async (query, ctx) => {
  const schema = strapi.getModel('plugin::users-permissions.user');
  const { auth } = ctx.state;

  return sanitize.contentAPI.query(query, schema, { auth });
};

async function generateUniqueUsername(username: string, index = 0) {
  const userWithThisUsername = await strapi
  .query('plugin::users-permissions.user')
  .findOne({ where: {username: username + index} });

  if (userWithThisUsername) return await generateUniqueUsername(username, index + 1);
  return username + index;
}

module.exports = (plugin) => {
  const checkVerified = (userId: string) => {
    setTimeout(async ()=>{
      const user = await strapi
        .query('plugin::users-permissions.user')
        .findOne({ where: {id: userId} });

      if(user && !user.confirmed) {
        await strapi.plugins['users-permissions'].services.user.remove({id: user.id});
      } 
    }, 180000)
  }

  plugin.controllers.user.me = async (ctx) => {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized();
    }
    
    const lcForm = await strapi
    .query('api::live-chat-client.live-chat-client')
    .findOne({ where: {id: user["lc_form_id"]}, populate: ['cheques', "live_chat_client_childrens"], });

    if (lcForm) {
      user["lc_form"] = lcForm;
    }

    ctx.body = await sanitizeOutput(user, ctx);
  }
  plugin.controllers.user.find = async (ctx) => {
    await validateQuery(ctx.query, ctx);
    const sanitizedQuery = await sanitizeQuery(ctx.query, ctx);
    const users = await strapi.plugin('users-permissions').service("user").fetchAll(sanitizedQuery);

    const fullUsers = [];
    for (const user of users) {
      const lcForm = await strapi
      .query('api::live-chat-client.live-chat-client')
      .findOne({ where: {id: user["lc_form_id"]}, populate: ['cheques', "live_chat_client_childrens"], });

      fullUsers.push({...user, "lc_form": lcForm});
    }

    ctx.body = await Promise.all(fullUsers.map((user) => sanitizeOutput(user, ctx)));
  },

  plugin.controllers.user.createDefault = async (ctx) => {
    const { name, ...props } = ctx.request.body;

    const username = await generateUniqueUsername(transliterate(name));
    
    const user = {
        name,
        username,
        email: 'eqxample@example.ru',
        provider: 'local',
        role: undefined,
        ...props
    };

    const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' });
    const settings: any = await pluginStore.get({ key: 'advanced' });

    const role = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: settings.default_role } });

    user.role = role.id;

    
    try {
      const createdUser = await strapi.services['plugin::users-permissions.user'].add(user);
      const response = {
        name,
        username,
        id: createdUser.id
      }
      ctx.created(response);
    } catch (error) {
      ctx.badRequest(error);
    }
  };

  plugin.controllers.user.create = async (ctx) => {
    const { phone, name } = ctx.request.body;

    const users = await strapi
    .query('plugin::users-permissions.user')
    .findMany()
  
    const fullUsers = [];
    for (const user of users) {
      if (user["lc_form_id"] === null) continue;
      const lcForm = await strapi
      .query('api::live-chat-client.live-chat-client')
      .findOne({ where: {id: user["lc_form_id"]}, populate: ['cheques', "live_chat_client_childrens"], });

      fullUsers.push({...user, "lc_form": lcForm});
    }

    const countChildrens = fullUsers.reduce((total, user) => total + (user?.lc_form?.live_chat_client_childrens?.length || 0) , 0)
    const allUsersCount = fullUsers.length + countChildrens

    if (allUsersCount >= 330) return ctx.badRequest('Регистрация закрыта. Превышено допустимое количество зарегистрированных участников');

    if (!phone) return ctx.badRequest('Введите номер телефона');
    if (!name) return ctx.badRequest('Введите имя и фамилию');
    
    const userWithThisNumber = await strapi
        .query('plugin::users-permissions.user')
        .findOne({ where: {phone} });
    
    if (userWithThisNumber && userWithThisNumber.confirmed) {
        return ctx.badRequest(
          "Пользователь с таким номером уже существует. Выполните вход"
        );
    } else if (userWithThisNumber && !userWithThisNumber.confirmed) {
      await strapi.plugins['users-permissions'].services.user.remove({id: userWithThisNumber.id});
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

    
    try {
      const createdUser = await strapi.services['plugin::users-permissions.user'].add(user);
      checkVerified(createdUser.id);
      const response = {
        name,
        username,
        id: createdUser.id
      }
      await sendSmsCode(code, `+7${phone}`);
      ctx.created(response);
    } catch (error) {
      ctx.badRequest(error);
    }
  };
  
  plugin.controllers.user.verifyAccount = async (ctx) => {
    const { id, code } = ctx.request.body;

    const verifyUser = await strapi
    .query('plugin::users-permissions.user')
    .findOne({ where: {id, code} });

    if (!verifyUser) {
      return ctx.badRequest(
        "Пользователь с указанным кодом не найден. Возможно, первышено время верификации (5 минут)"
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
    const {phone, id, channel} = ctx.request.body;

    if (!phone && !id) return ctx.badRequest(
      "Не заданы входные данные"
    );
    const user = await strapi
    .query('plugin::users-permissions.user')
    .findOne(phone ? { where: {phone} } : { where: {id} });

    if (user && !user.confirmed && phone) {
      return ctx.badRequest(
        "Пользователя с таким номером не существует"
      );
    }
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
      status: 'success',
      id: user.id
    }

    try {
      await strapi.plugins['users-permissions'].services.user.edit(user.id, updateData);
      switch (channel) {
        case "voice":
          await sendVoiceCode(code, `+7${user.phone}`);
          break;
        case "sms":
          await sendSmsCode(code, `+7${user.phone}`);
          break;
      }
      ctx.created(response);
    } catch (error) {
      ctx.badRequest(error);
    }
  }

  plugin.controllers.user.setLcForm = async (ctx) => {
    const user = ctx.state.user;
    const {lcFormId} = ctx.request.body;

    const lcForm = await strapi
    .query('api::live-chat-client.live-chat-client')
    .findOne({ where: {id: lcFormId} });

    if (!user) {
      return ctx.unauthorized();
    }

    if (!lcForm) {
      return ctx.badRequest(
        "Формы с ID не найдено"
      );
    }
    

    let updateData = {
      "lc_form_id": String(lcFormId)
    };

    await strapi.plugins['users-permissions'].services.user.edit(user.id, updateData);

    ctx.send({ status: "success" });
  };

  plugin.controllers.user.updateUser = async (ctx) => {
    const user = ctx.state.user;
    const data = ctx.request.body;

    if (!user) {
      return ctx.unauthorized();
    }
  
    let updateData = data;

    await strapi.plugins['users-permissions'].services.user.edit(user.id, updateData);

    ctx.send({ status: "success" });
  };

  plugin.controllers.user.deleteUser = async (ctx) => {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized();
    }

    const resDeleteForm = await strapi
    .query('api::live-chat-client.live-chat-client')
    .delete({ where: {id: user.lc_form_id} });
    const resDeleteUser = await strapi.plugins['users-permissions'].services.user.remove({id: user.id});

    ctx.send({ status: "success" });
  };
  
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
    {
      method: "POST",
      path: "/setLcForm",
      handler: "user.setLcForm",
    },
    {
      method: "PUT",
      path: "/profile",
      handler: "user.updateUser",
    },
    {
      method: "DELETE",
      path: "/profile",
      handler: "user.deleteUser",
    },
    {
      method: "POST",
      path: "/createDefault",
      handler: "user.createDefault",
    },
  ];

  return plugin;
};

function random4Digit(){
  return isDevelopMode ? 4444 : Math.floor(1000 + Math.random() * 9000);
}

