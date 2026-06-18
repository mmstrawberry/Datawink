import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

// MiMo V2.5 配置（mimo-v2.5 支持视觉，mimo-v2.5-pro 不支持）
// Token Plan 用户使用 token-plan-cn.xiaomimimo.com
const model = "mimo-v2.5"
const baseURL = "https://token-plan-cn.xiaomimimo.com/v1"

// use openai api to get the chat completion
const getChatCompletion = (messages: ChatCompletionMessageParam[],
    key: string,
    responseFormat: OpenAI.ResponseFormatJSONSchema,
    temperature: number = 0.5,
) => {
    const openai = new OpenAI({
        apiKey: key,
        baseURL,
        dangerouslyAllowBrowser: true
    });
    console.log('send request to MiMo V2.5 Pro')
    const completion = openai.chat.completions.create({
        model,
        messages,
        response_format: responseFormat,
        temperature,
        stream: false
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Authorization': `Bearer ${key}`
        }
    });
    return completion
}


export default getChatCompletion;