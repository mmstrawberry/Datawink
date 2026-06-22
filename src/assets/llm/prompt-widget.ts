import { AnthropicMessageParam } from "./index"

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
In your response, please return ONLY a valid JSON object with the following structure:
{
    "response": "a natural language response to the user regarding the update of the visualization and new widgets. Pay attention to the language used by the user.",
    "code": "the updated javascript code string to achieve the user's requirement, using the four parameters (data, params, svgId, svgTemplate) as the original code",
    "defaultParamsJsonStr": "the json string of all default parameters, including newly included variables and the old ones",
    "newDataJsonStr": "the json string of the new data array, you may need to update the data to achieve the user's requirement. Input the old data if no update is needed.",
    "newParamsIntro": [
        {
            "key": "the name of the parameter",
            "alias": "a very short self-explanatory name with no more than 3 words (optional)",
            "defaultValue": "the default value formatted as a string",
            "valueType": "the type: 'number', 'string', or 'Array<string>'",
            "valueRange": ["the value range as array of strings"],
            "widgetType": "recommended widget: 'slider', 'checkbox', 'select', 'colorpicker', 'input'",
            "widgetDescription": "a short description no more than 10 words"
        }
    ]
}

IMPORTANT: Return ONLY the JSON object, no markdown, no explanation, no code blocks. The "code" field must contain valid JavaScript. Escape all special characters properly in the JSON strings.`

    const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
    return [{
        role: 'user' as const,
        content: [
            {
                type: 'text' as const,
                text: SYSTEM_WIDGET_PROMPT + "\n\n" + prompt
            },
            {
                type: 'image' as const,
                source: {
                    type: 'base64' as const,
                    media_type: 'image/png' as const,
                    data: base64,
                },
            }
        ]
    }

    ] as AnthropicMessageParam[]
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



const WidgetResultSchema = undefined;

export {
    getWidgetPrompt,
    type WidgetResult,
    WidgetResultSchema
}
