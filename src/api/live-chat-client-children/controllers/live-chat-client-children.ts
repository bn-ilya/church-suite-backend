import { factories } from '@strapi/strapi';

export default factories.createCoreController(
  'api::live-chat-client-children.live-chat-client-children',
  ({ strapi }) => ({
    async bulkCreate(ctx) {
      const { data } = ctx.request.body;

      if (!Array.isArray(data)) {
        return ctx.badRequest("Data must be an array");
      }

      try {
        const createdEntries = await Promise.all(
          data.map((entry) =>
            strapi.entityService.create('api::live-chat-client-children.live-chat-client-children', {
              data: entry,
            })
          )
        );

        return {data: createdEntries};
      } catch (error) {
        // Обрабатываем ошибку
        return ctx.internalServerError("Something went wrong", error);
      }
    },
  })
);