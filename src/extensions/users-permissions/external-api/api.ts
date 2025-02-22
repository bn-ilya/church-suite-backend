import axios from "axios";
import { isDevelopMode } from "../../../flags";

axios.defaults.baseURL = 'https://direct.i-dgtl.ru/api/v1';
axios.defaults.headers.common['Authorization'] = "Basic MTA5NTk6RW1YTkI3YXZUWHRLdExoQk1JUFVYNQ==";
axios.defaults.headers.post['Content-Type'] = 'application/json'

export async function sendVoiceCode(code: string, phone: string) {
  try {
    const response = await axios({
      method: 'post',
      url: '/message',
      data: {
        channelType: "VOICECODE",
        senderName: "voicecode",
        destination: phone,
        content: {
          contentType: "text",
          text: `${code} - код авторизации от live chat`
        }
      }
    });
  
  
    return response;
  } catch (error) {
    return error.response.data.error
  }

}

export async function sendSmsCode(code: string, phone: string) {
  if (isDevelopMode) return "success";
  try {
    const response = await axios({
      method: 'post',
      url: '/message',
      data: {
        channelType: "SMS",
        senderName: "sms_promo",
        destination: phone,
        content: `${code} - код авторизации от live chat`
      }
    });  

    return response;
  } catch (error) {
    return error.response.data.error
  }


}