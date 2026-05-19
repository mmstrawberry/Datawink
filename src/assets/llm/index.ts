import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";



const model = "gpt-5.4-nano" // "gpt-4o-mini";

// use openai api to get the chat completion
const getChatCompletion = (messages: ChatCompletionMessageParam[], 
    key: string, 
    responseFormat: OpenAI.ResponseFormatJSONSchema,
    temperature: number = 0.5,
) => {
    const openai = new OpenAI({
        apiKey: key,
        dangerouslyAllowBrowser: true
    });
    console.log('send request to openai')
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