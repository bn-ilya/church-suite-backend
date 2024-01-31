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
  return shuffle( "0123456789".split('') ).join('').substring(0,4);
}

function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}