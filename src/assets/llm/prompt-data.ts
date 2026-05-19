import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod.mjs"
import { z } from "zod"
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs"
const DATA_SYSTEM_PROMPT = `You are a helpful assistant that well understands data visualization, visualization grammar, and SVG specifications.`

const getDataTablePrompt = (svg: string, img: string) => {
    const prompt = `Please analyze the SVG string and extract the data table. You may need to use the image to help you better understand the context.

Here is the SVG string:
${svg}

In you response, you should return an array of objects, each object is a data point.
For instance, [{
    "dim1": "val1",
    "dim2": "val2",
    "dim3": "val3"
}, {
    "dim1": "val1",
    "dim2": "val2",
    "dim3": "val3" 
}]
`
    return [{
        role: "system",
        content: DATA_SYSTEM_PROMPT
    },
    {
        role: "user",
        content: [{
            type: "text",
            text: prompt,
        },
        {
            type: "image_url",
            image_url: {
                url: img,
            }
        }]
    }] as ChatCompletionMessageParam[]
}


const dataFormat = zodResponseFormat(z.object({
    jsonifiedDatumArray: z.array(z.string()).describe("data table represented as an array of strings, each string is a JSON object")
}), "data-table") as unknown as OpenAI.ResponseFormatJSONSchema

interface LiteralDataFormat {
    jsonifiedDatumArray: string[]
}
interface DataFormat {
    jsonifiedDatumArray: Record<string, number|string>[]
}

export {
    getDataTablePrompt,
    dataFormat,
    type DataFormat,
    type LiteralDataFormat
}

