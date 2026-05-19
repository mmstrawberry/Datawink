import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod.mjs"
import { ChatCompletionMessageParam } from "openai/resources/index.mjs"
import { z } from "zod"

const GENERATOR_SYSTEM_PROMPT = `You are a skillful programmer who may write consistent and readable data visualization templates based on d3 v7.`

const getGeneratorPrompt = (svg: string, data: Record<string, number|string>[], encodingInfo: string, img: string) => {
  const prompt = `Based on the given SVG string wrapped by <g data-vis-layer="..." data-slot="..."> markers for injecting data-driven elements, the decomposition of the visual structure, and the code, please write code and provide function parameters to synthesize different data-driven elements based on the data values. And then put them back into the SVG string template according to its slot id. You can only use d3 v7 and color.js as external libraries.

This is an example of a barchart with two bars.
<svg>
  <g>
    <img src="image.png" />
  </g>
  <g>
    <rect x="10" y="10" width="10" height="10" data-color="red" />
    <rect x="20" y="10" width="10" height="18" data-color="blue" />
  </g>
</svg>

Suppose the data is known to be 
\`\`\`
[
    {
        "A": 'Type 1',
        "B": 20
    }, {
        "A": 'Type 2',
        "B": 25
    }
]
\`\`\`

We can derive a SVG template as follows:
\`\`\`svg
<svg>
  <g data-vis-layer="image" data-slot="SLOT_1">
    <img src="image.png" />
  </g>
  <g>
    <g data-vis-layer="mark" data-slot="SLOT_2">
    <!-- the elements will be removed, only the code will inserted data-driven elements here -->
    </datagroup>
  </g>
</svg>
\`\`\`

A possible code to generate the above SVG is:
\`\`\`javascript
const visualize = (data, params, svgId, template) => {
    const svgDoc = new DOMParser().parseFromString(template, 'text/xml')
    const svg = d3.select(svgDoc.documentElement)
    const x = d3.scaleBand().domain(data.map(d => d[params.xField])).range([params.chartOriginX, params.chartOriginX + params.chartWidth])
    const y = d3.scaleLinear().domain(data.map(d => d[params.yField])).range([params.chartOriginY, params.chartOriginY + params.chartHeight])
    const color = d3.scaleOrdinal(params.colorPalette)
    const barsSlot = svg.select('[data-slot="SLOT_2"]') // find the slot for the bars
    barsSlot.selectAll("*").remove()
    barsSlot.selectAll("rect").data(data).enter().append("rect")
        .attr("x", d => x(d[params.xField]))    
        .attr("y", d => y(d[params.yField]))
        .attr("width", x.bandwidth())    
        .attr("height", d => y(d[params.yField]))
        .attr("fill", d => color(d[params.xField]))
   return svg.documentElement.outerHTML
}
\`\`\`

Here, the "data" is the same as the data in the example.
The "params" is an object that contains many variables to be used in the code. Please inherit all the global variables from the data encoding scheme, andtry your best to derive as many variables as possible.
The "svgId" is the id of the SVG element for displaying the visualization.
The "template" is the SVG template (where data-driven elements are removed) to be manipulated.


Here is the real reference SVG string IN YOUR TASK:
${svg}

Here is the sample data, there are actually more data points in the real data (N=${data.length}):
${JSON.stringify(data.slice(0, 5))}

Here is some information about the data encoding scheme for your reference.
${encodingInfo}



IN YOUR CODE, YOU MUST USE THE FUNCTION NAME "visualize" AND THE PARAMETERS (data, params, svgId, svgTemplate).
THE SNIPPET CONTAINS THE JAVASCRIPT FUNCTION ONLY.

IN YOUR RESPONSE, YOU SHOULD PROVIDE THE FOLLOWING THREE FIELDS:
- "code": the js function NAMED "visualize" with four parameters (data, params, svgId, svgTemplate)
- "svgTemplate": the FULL SVG template to be manipulated; DO NOT MISS ANYTHING.
- "defaultParamsJsonStr": a full list of the default parameters in the "params" object, including "xField", "yField", "chartOriginX", "chartOriginY", "chartWidth", "chartHeight", "svgWidth", "svgHeight", "svgViewBox", "coordinateType", "chartType", etc., and value ranges for the visual attributes, according to the encoding scheme.
`
    return [{
        role: "system",
        content: GENERATOR_SYSTEM_PROMPT
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


const generatorFormat = zodResponseFormat(z.object({
    code: z.string().describe("the js code to generate the visualization with four parameters (data, params, svgId, svgTemplate)"),
    svgTemplate: z.string().describe("the SVG template to be manipulated"),
    defaultParamsJsonStr: z.string().describe("the jsonified default parameters for the visualization, such as the xField, yField, colorRanges, etc.")
}), "code-generator") as unknown as OpenAI.ResponseFormatJSONSchema

interface GeneratorResult {
    code: string;
    svgTemplate: string;
    defaultParamsJsonStr: string;
}

export {
    getGeneratorPrompt,
    GENERATOR_SYSTEM_PROMPT,
    generatorFormat,
    type GeneratorResult
}