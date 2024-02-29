import axios from "axios";

axios.defaults.baseURL = 'https://direct.i-dgtl.ru/api/v1';
axios.defaults.headers.common['Authorization'] = "Basic NjgyNDp2OEpxSUhEVGJxSVlUdEIzTkNXdmwy";
axios.defaults.headers.post['Content-Type'] = 'application/json'

export async function sendVoiceCode(code: string, phone: string) {
  const response = await axios({
    method: 'post',
    url: '/message',
    data: {
      channelType: "VOICECODE",
      senderName: "voicecode",
      destination: phone,
      content: {
        contentType: "text",
        text: `Код авторизации от лайв чат: ${code}`
      }
    }
  });

  return response;
}

export async function sendSmsCode(code: string, phone: string) {
  const response = await axios({
    method: 'post',
    url: '/message',
    data: {
      channelType: "SMS",
      senderName: "sms_promo",
      destination: phone,
      content: `Код авторизации от лайв чат: ${code}`
    }
  });

  return response;
}