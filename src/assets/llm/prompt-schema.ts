import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod.mjs"
import { z } from "zod"
import { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs"

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
`
    return [{
        role: "system",
        content: SCHEMA_SYSTEM_PROMPT
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
            },
        }]
    }] as ChatCompletionMessageParam[]
}

const schemaFormat = zodResponseFormat(z.object({
    global: z.object({
        svgWidth: z.number(),
        svgHeight: z.number(),
        svgViewBox: z.string(),
        chartWidth: z.number().describe("the width of the chart region within the canvas"),
        chartHeight: z.number().describe("the height of the chart region within the canvas"),
        chartOriginX: z.string().describe("the x coordinate of the origin of the chart within the canvas"),
        chartOriginY: z.string().describe("the y coordinate of the origin of the chart within the canvas"),
        // z.enum becomes a JSON Schema "enum" for structured outputs; .refine() on z.string() is not
        // reliably exported to the API schema, so models often returned free-form strings with "(...)".
        coordinateType: z
            .enum(["cartesian", "polar", "others"])
            .describe("Exactly one of: cartesian | polar | others. No parenthetical text."),
        chartType: z
            .enum(["bar", "line", "scatter", "others"])
            .describe("Exactly one of: bar | line | scatter | others. No parenthetical text."),
    }),
    axis: z.object({
        xAxisDataAttr: z.string().optional(),
        yAxisDataAttr: z.string().optional(),
        radiusAxisDataAttr: z.string().optional(),
        howToLabel: z.string().optional().describe("A description of how the axis is labeled in the SVG"),
        howToEncode: z.string().optional().describe("A description of the axis domain, range, and scale type in the SVG"),
    }),
    dataElementTypes: z.array(z.object({
        tagName: z.string().describe("the tag name of the data-driven element"),
        identifier: z.string().describe("the pure CSS querySelector identifier of the data-driven element group, such as the class name of the element or shared properties"),
        encodedEleAttrs: z.array(z.object({
            eleAttr: z.string().describe("the attribute of the element"),
            dataAttr: z.string().describe("the data attribute that is encoded in the element attribute"),
            eleAttrRange: z.array(z.union([z.string(), z.number()])).describe("the range of the element attribute"),
            howToEncode: z.string().describe("A description of how the data is encoded in the SVG, especially for the layout and relative position to its parent element"),
        })),
        fixedAttr: z.array(z.object({
            attribute: z.string(),
            value: z.union([z.string(), z.number()]),
        })).describe("the element attributes that are fixed and do not encode the data"),
        encodedDataAttr: z.array(z.string()).describe("the data attributes that are mapped to the encodedSvgAttr"),
        howToEncode: z.string().describe("A description of how the data is encoded in the SVG"),
        oneExampleElement: z.string().describe("one example element from the SVG that is of this type"),
    })),
    legend: z.object({
        mappings: z.array(z.object({
            dataAttr: z.string(),
            valueRange: z.array(z.string()),
            howToEncode: z.string(),
        })).describe("the mappings of the data attributes to the value range and the description of how to encode the legend"),
        locationInSVG: z.string().describe("the location of the legend in the SVG"),
    }),
    annotation: z.object({
        dataAttrs: z.array(z.string()),
        howToEncode: z.string(),
    }),
}), "schema-format") as unknown as OpenAI.ResponseFormatJSONSchema




export {
    getSchemaPrompt,
    SCHEMA_SYSTEM_PROMPT,
    schemaFormat
}

