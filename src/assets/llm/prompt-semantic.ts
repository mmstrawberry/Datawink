/**
 * This module is used to enrich the SVG with semantics in the decorative elements.
 */

import { ChatCompletionMessageParam } from "openai/src/resources/chat/completions/index.js"
import { tidySvgWithHeuristics } from "../svg/svg-processing"
import { z } from "zod"
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

const SEMANTIC_SYSTEM_PROMPT = `You are a sharp designer that can write meaningful explanations for the given SVG string and format it properly.
`


// Phase I Module 3: Layer Extraction
const getSemanticPrompt = (svg: string, img: string) => {
    const tidySvg = tidySvgWithHeuristics(svg)
    const prompt = `Please look at the SVG and enrich the the image elements (marked as vis-layer="image") by extending its attribute \`vis-detail-description\`.
     DO NOT CHANGE THE ORIGINAL SVG ELEMENTS. NEVER USE ABBREVIATION!
 <g vis-layer="image" vis-detail-description="...A MODERATE DESCRIPTION OF THE IMAGE..."></g> in proper layers. .
HERE IS THE SVG STRING:
${tidySvg}

In your response, please include the following as a JSON object:
{
    "interpretation": "Your understanding of the visual content in the image."
    "extendedSvg": "<svg>...</svg>",
}`

    return [{
        role: "system",
        content: SEMANTIC_SYSTEM_PROMPT
    },
    {
        role: "user",
        content: [
            {
                type: "text",
                text: prompt,
            },
            {
                type: "image_url",
                image_url: {
                    url: img,
                },
            }
        ]
    }] as ChatCompletionMessageParam[]
}

const semanticFormat = zodResponseFormat(z.object({
    analysis: z.string(),
    extendedSvg: z.string(),
}), "svg-observe") as unknown as OpenAI.ResponseFormatJSONSchema

interface SemanticResult {
    analysis: string;
    extendedSvg: string;
}

export {
    getSemanticPrompt,
    semanticFormat,
    type SemanticResult
}
