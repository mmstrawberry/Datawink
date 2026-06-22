import { AnthropicMessageParam } from "./index"

const DATA_SYSTEM_PROMPT = `You are a helpful assistant that well understands data visualization, visualization grammar, and SVG specifications.`

const getDataTablePrompt = (svg: string, img: string) => {
    const prompt = `Please analyze the SVG string and extract the data table. You may need to use the image to help you better understand the context.

Here is the SVG string:
${svg}

In your response, please return ONLY a valid JSON object with the following structure:
{
    "jsonifiedDatumArray": ["{...}", "{...}"]
}

Each string in the array should be a JSON object representing a data point.
For instance:
{
    "jsonifiedDatumArray": ["{\\"dim1\\": \\"val1\\", \\"dim2\\": \\"val2\\", \\"dim3\\": \\"val3\\"}", "{\\"dim1\\": \\"val1\\", \\"dim2\\": \\"val2\\", \\"dim3\\": \\"val3\\"}"]
}

IMPORTANT: Return ONLY the JSON object, no markdown, no explanation, no code blocks.`

    const base64 = img.replace(/^data:image\/\w+;base64,/, "");
    return [{
        role: "user" as const,
        content: [
            {
                type: "text" as const,
                text: DATA_SYSTEM_PROMPT + "\n\n" + prompt,
            },
            {
                type: "image" as const,
                source: {
                    type: "base64" as const,
                    media_type: "image/png" as const,
                    data: base64,
                },
            }
        ]
    }] as AnthropicMessageParam[]
}


const dataFormat = undefined;

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
