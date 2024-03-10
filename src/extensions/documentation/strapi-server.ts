'use strict';
const documentationController = require('./controllers/documentation');
const documentationRoutes = require('./routes/custom-documentation');
module.exports = async (plugin) => {
  // Controllers
  plugin.controllers.documentation = {
    ...plugin.controllers.documentation,
    ...documentationController
  };
  // Routes
  plugin.routes = [...plugin.routes, ...documentationRoutes.routes];
  return plugin;
};