/**
 * This module is used to observe the SVG string and extract the data schema and layered SVG string.
 */

import { AnthropicMessageParam } from "./index"
import { tidySvgWithHeuristics } from "../svg/svg-processing"

const OBSERVE_SYSTEM_PROMPT = `You are a helpful design assistant that can write meaningful explanations for the given SVG string and format it properly.
`


// Phase I Module 3: Layer Extraction
const getObservePrompt = (svg: string, img: string) => {
    const tidySvg = tidySvgWithHeuristics(svg)
    const prompt = `Please complete three tasks. DO NOT CHANGE THE ORIGINAL SVG ELEMENTS. NEVER USE ABBREVIATION! YOU CAN ONLY ADD NEW GROUP AND ADD ATTRIBUTE.
Task A: Look at the image and analyze its visual design and data encoding scheme.
Task B: Briefly describe the data in JSON schema format by looking into the image. Pay attention to the axis and value label.
Task C: Based on the original SVG string, wrap elements into <g> layers using <g data-vis-layer="..." data-slot="...">...</g>. DO NOT CHANGE THE ATTRIBUTES. Data-slot is a unique identifier for the layer.
1. Group the <img> or <g> elements of a coherent visual concept into <g data-vis-layer="image" data-vis-description="A BRIEF DESCRIPTION OF THE IMAGE...">...</g> in proper layers. ONLY INCLUDE NON-DATA-DRIVEN IMAGES.
2. Group the axis, grid, tick, and relevant label elements into <g data-vis-layer="axis" data-slot="...">...</g>. DO NOT CHANGE THE ATTRIBUTES. It is possible that they are absent.
3. Group all repeatitive data-driven visual marks of the same type into <g data-vis-layer="mark" data-slot="...">...</g> layer. DO NOT CHANGE THE ATTRIBUTES. THERE CAN BE MULTIPLE LAYERS OF MARK. Assign a unique slot id k to each layer.
4. Group the legend into <g data-vis-layer="legend" data-slot="...">...</g>. Can be absent. DO NOT CHANGE THE ATTRIBUTES.

HERE IS THE SVG STRING:
${tidySvg}

In your response, please return ONLY a valid JSON object with the following structure:
{
    "analysis": "Your understanding of the visual design in the chart, e.g., what type is the chart, what is the data, what is the message, what is the design, etc.",
    "dataSchema": "the retrieved data formatted in CSV",
    "layeredSvg": "<svg>...</svg>"
}

IMPORTANT: Return ONLY the JSON object, no markdown, no explanation, no code blocks.`

    const base64 = img.replace(/^data:image\/\w+;base64,/, "");
    return [{
        role: "user" as const,
        content: [
            {
                type: "text" as const,
                text: OBSERVE_SYSTEM_PROMPT + "\n\n" + prompt,
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

const observeFormat = undefined;

export interface ObserveResult {
    analysis: string;
    dataSchema: string;
    layeredSvg: string;
}

export {
    getObservePrompt,
    observeFormat
}
