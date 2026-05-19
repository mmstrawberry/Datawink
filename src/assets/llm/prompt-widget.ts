import { ChatCompletion, ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { z } from "zod"
import { zodResponseFormat } from "openai/helpers/zod"
import OpenAI from "openai"

const SYSTEM_WIDGET_PROMPT = `You are a skillful data visualization developer. You are given a aesthetic visualization template code and parameters based on d3, its rendered SVG string and corresponding data array. Please update the code and parameters to achieve the user's requirement. You may need to define new parameter.
`

const getWidgetPrompt = (code: string, svgTemplate: string, data: Array<Record<string, string | number>>, params: Record<string, string | any>, schema: Record<string, string | any>, userPrompt: string, imageData: string) => {
    const prompt = `
### Background Information
Dataset
\`\`\`json
${JSON.stringify(data)}
\`\`\`

Code to generate the visualization. Note that the code is based on d3 v7 and there should be four input, i.e., data, params, svgId, svgTemplate.
\`\`\`javascript
${code}
\`\`\`

Parameters used in the code
\`\`\`json
${JSON.stringify(params)}
\`\`\`

Visualization template that the code is based on
\`\`\`svg
${svgTemplate}
\`\`\`

### User's requirement
\`\`\`
${userPrompt}
\`\`\`

### Task
1. Generate natural language response to the user in their language.
2. Update the code to achieve the user's requirement, adding new variables in the "params" object if necessary for user control. If structural changes are needed for the svg template, please also include code to manipulate the svg template.
3. For the newly included variables, include their default value and value range in the "defaultParamsJsonStr" object. It is totally ok not introducing new variables.
4. Provide a short introduction in the "newParamsIntro" object.

### Output
- "response": a natural language response to the user.
- "code": the updated code to achieve the user's requirement, following the same format as the original code.
- "newDataJsonStr": the new data to be used in the code, you may need to update the data to achieve the user's requirement. Input the old data if no update is needed.
- "defaultParamsJsonStr": all the default parameters, including newly included variables.
- "newParamsIntro": the newly included parameters (ONLY LIST THE NEW ONES)
  - "key": the name of the parameter
  - "defaultValue": the default value of the parameter formatted as a string, this can be a list of values separated by commas
  - "valueType": the type of the parameter, including 'number', 'string', 'Array<string>'
  - "valueRange": the value range of the parameter, including the minimum and maximum values or categories in the format of an array of strings
  - "widgetType": recommended widget for user control, including 'slider', 'checkbox', 'select', 'colorpicker', 'input'.
  - "widgetDescription": a short description of the widget no more than 10 words
`
    return [{
        role: 'system',
        content: SYSTEM_WIDGET_PROMPT
    },
    {
        role: 'user',
        content: [
            {
                type: 'text',
                text: prompt
            },
            {
                type: 'image_url',
                image_url: {
                    url: imageData
                }
            }
        ]
    }

    ] as ChatCompletionMessageParam[]
}

export interface NewParamProps {
    key: string;
    defaultValue: string | number;
    valueType: string;
    valueRange: string[] | number[];
    widgetType: string;
    widgetDescription: string;
    alias?: string;
}

export interface ParsedNewParamProps {
    key: string;
    defaultValue: string | number; 
    valueType: string | number | string[] | number[];
    valueRange: string[] | number[];
    widgetType: string;
    widgetDescription: string;
    alias?: string;
} 
interface WidgetResult {
    response: string;
    code: string;
    defaultParamsJsonStr: string;
    newDataJsonStr: string;
    newParamsIntro: NewParamProps[];
}



const WidgetResultSchema = zodResponseFormat(z.object({
    response: z.string().describe("a short natural language response to the user regarding the update of the visualization and new widgets. Pay attention to the langauge used by the user."),
    code: z.string().describe("the updated javascript code string to achieve the user's requirement, using the four parameters (data, params, svgId, svgTemplate) as the original code"),
    defaultParamsJsonStr: z.string().describe("the default parameters to be used in the code, including newly included variables and the old ones"),
    newDataJsonStr: z.string().describe("the new data to be used in the code, you may need to update the data to achieve the user's requirement. Input the old data if no update is needed. The type is Array<Record<string, string | number>>"),
    newParamsIntro: z.array(z.object({
       key: z.string().describe("the name of the parameter"),
       alias: z.string().optional().describe("a very short self-explanatory name of the parameter with no more than 3 words"),
       defaultValue: z.string().describe("the default value of the parameter formatted as a string, this can be a jsonified string for array"),
       valueType: z.string().describe("the type of the parameter, including 'number', 'string', 'Array<string>'"),
       valueRange: z.array(z.string()).describe("the value range of the parameter, including the minimum and maximum values or categories in the format of an array of strings"),
       widgetType: z.string().describe("the recommended widget for user control, including 'slider', 'checkbox', 'select', 'colorpicker', 'input'"),
       widgetDescription: z.string().describe("a short description of the widget no more than 10 words")
    })).describe("the newly included parameters, including the default value and value range and recommended widget type")
}), "widget-result") as unknown as OpenAI.ResponseFormatJSONSchema

   

export {
    getWidgetPrompt,
    type WidgetResult,
    WidgetResultSchema
}