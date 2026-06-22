/**
 * This module is used to enrich the SVG with semantics in the decorative elements.
 */

import { AnthropicMessageParam } from "./index"
import { tidySvgWithHeuristics } from "../svg/svg-processing"

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

In your response, please return ONLY a valid JSON object with the following structure:
{
    "analysis": "Your understanding of the visual content in the image.",
    "extendedSvg": "<svg>...</svg>"
}

IMPORTANT: Return ONLY the JSON object, no markdown, no explanation, no code blocks.`

    const base64 = img.replace(/^data:image\/\w+;base64,/, "");
    return [{
        role: "user" as const,
        content: [
            {
                type: "text" as const,
                text: SEMANTIC_SYSTEM_PROMPT + "\n\n" + prompt,
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

const semanticFormat = undefined;

interface SemanticResult {
    analysis: string;
    extendedSvg: string;
}

export {
    getSemanticPrompt,
    semanticFormat,
    type SemanticResult
}
