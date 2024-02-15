import axios from "axios";

axios.defaults.baseURL = 'https://direct.i-dgtl.ru/api/v1';
axios.defaults.headers.common['Authorization'] = "Basic NjgyNDp2OEpxSUhEVGJxSVlUdEIzTkNXdmwy";
axios.defaults.headers.post['Content-Type'] = 'application/json'

export async function sendVoiceCode(code: string) {
  const response = await axios({
    method: 'post',
    url: '/message',
    data: {
      channelType: "VOICECODE",
      senderName: "voicecode",
      destination: "+79284131458",
      content: {
        contentType: "text",
        text: `Код авторизации от live-chat: ${code}`
      }
    }
  });

  return response;
}