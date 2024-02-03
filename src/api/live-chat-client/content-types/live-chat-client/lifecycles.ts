export default {
  async beforeCreate(event) {
    const code = await generateCode();
    event.params.data.code = code;
  },
};

async function searchCodeInDb(code: number) {
  return await strapi.db.query('api::live-chat-client.live-chat-client').findOne({
    select: ['code'],
    where: { code },
  });
}

async function generateCode() {
  const code = random4Digit();
  const searchingCode = await searchCodeInDb(code);

  if (searchingCode !== null) return generateCode();
  return code;
}

function random4Digit(){
  return Math.floor(1000 + Math.random() * 9000);
}
