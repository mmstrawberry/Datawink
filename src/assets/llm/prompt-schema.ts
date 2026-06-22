import { AnthropicMessageParam } from "./index"

const SCHEMA_SYSTEM_PROMPT = `You are a helpful assistant that well understands data visualization, visualization grammar, and SVG specifications.`

const getSchemaPrompt = (svg: string, img: string, dataset: string) => {
    const prompt = `Please analyze the SVG string and extract the following information.
1. Global information: SVG width, SVG height, SVG viewBox, the origins of the coordinate system, type of the coordinate system, and chart prototype. For coordinateType use only one token: cartesian, polar, or others (no parentheses or extra words). For chartType use only one token: bar, line, scatter, or others (e.g. a vertical bar chart is bar).
2. Data encoding scheme: What are the data-driven elements in the SVG? What are the attributes that encode the data? The data-driven elements can be the marks, deformed <path> elements, annotations, specific filters, etc. For categorical attributes especially colors, please also identify the value range. PLEASE PAY CAREFUL ATTENTION TO UNCOMMON DATA-DRIVEN ELEMENTS, SUCH AS <polygon> elements NESTED.
3. Axis information: What are the axes in the SVG? What are the attributes that encode the axis?
4. Legend information: What are the legends in the SVG? What are the attributes that encode the legend?
5. While annotations are also data-driven elements, please specify them as a separate category.

Here is the SVG string:
${svg}

Here is the dataset:
${dataset}

In your response, please return ONLY a valid JSON object with the following structure:
{
    "global": {
        "svgWidth": number,
        "svgHeight": number,
        "svgViewBox": "string",
        "chartWidth": number,
        "chartHeight": number,
        "chartOriginX": "string",
        "chartOriginY": "string",
        "coordinateType": "cartesian" | "polar" | "others",
        "chartType": "bar" | "line" | "scatter" | "others"
    },
    "axis": {
        "xAxisDataAttr": "string (optional)",
        "yAxisDataAttr": "string (optional)",
        "radiusAxisDataAttr": "string (optional)",
        "howToLabel": "string (optional)",
        "howToEncode": "string (optional)"
    },
    "dataElementTypes": [
        {
            "tagName": "string",
            "identifier": "string",
            "encodedEleAttrs": [
                {
                    "eleAttr": "string",
                    "dataAttr": "string",
                    "eleAttrRange": ["string or number"],
                    "howToEncode": "string"
                }
            ],
            "fixedAttr": [{"attribute": "string", "value": "string or number"}],
            "encodedDataAttr": ["string"],
            "howToEncode": "string",
            "oneExampleElement": "string"
        }
    ],
    "legend": {
        "mappings": [{"dataAttr": "string", "valueRange": ["string"], "howToEncode": "string"}],
        "locationInSVG": "string"
    },
    "annotation": {
        "dataAttrs": ["string"],
        "howToEncode": "string"
    }
}

IMPORTANT: Return ONLY the JSON object, no markdown, no explanation, no code blocks.`

    const base64 = img.replace(/^data:image\/\w+;base64,/, "");
    return [{
        role: "user" as const,
        content: [{
            type: "text" as const,
            text: SCHEMA_SYSTEM_PROMPT + "\n\n" + prompt,
        },
        {
            type: "image" as const,
            source: {
                type: "base64" as const,
                media_type: "image/png" as const,
                data: base64,
            },
        }]
    }] as AnthropicMessageParam[]
}

const schemaFormat = undefined;

export {
    getSchemaPrompt,
    SCHEMA_SYSTEM_PROMPT,
    schemaFormat
}
