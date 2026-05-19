import { SchemaResult } from "./types";

const tableData = [
    {
        "Year": 2015,
        "Value": 2
    },
    {
        "Year": 2016,
        "Value": 0
    },
    {
        "Year": 2017,
        "Value": 3
    },
    {
        "Year": 2018,
        "Value": 1
    }, 
    {
        "Year": 2019,
        "Value": 4
    },
    {
        "Year": 2020,
        "Value": 7
    }
] as Array<Record<string, string | number>>;

const sunset_plot_string = `(data, params, svgId, svgTemplate) => {
    const svg = d3.select('#'+svgId).html(svgTemplate);
    const x = d3.scaleBand().domain(data.map(d => d[params.xField])).range([params.baseX, params.baseX + params.chartWidth]).padding(0.4);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d[params.yField])]).range([params.baseY, params.baseY - params.chartHeight]);

    const barsGroup = svg.select('#test-bar-group')
    const barsEnter = barsGroup
        .selectAll('.year-group')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'year-group')
        .attr('transform', (d, i) => \`translate(\${x(d[params.xField])}, 0)\`);

    barsEnter.append('rect')
        .attr('class', 'bar-rect')
        .attr('x', 0)
        .attr('y', d => y(d[params.yField]))
        .attr('width', x.bandwidth())
        .attr('height', d => params.baseY - y(d[params.yField]))
        .attr('fill', 'black');

    barsEnter.append('text')
        .attr('class', 'bar-label')
        .attr('x', x.bandwidth() / 2)
        .attr('y', d => y(d[params.yField]) - 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12')
        .attr('fill', '#222')
        .text(d => d[params.yField]);

    barsEnter.append('polygon')
        .attr('class', 'bar-shadow')
        .attr('points', (d) => {
            const alpha = params.alpha;
            const h = params.baseY - y(d[params.yField]);
            const w = x.bandwidth();        
            return \`0,0 \${w},0 \${w + alpha * h},\${h} \${alpha * h},\${h}\`;
        })
        .attr('fill', 'url(#test-gradient)')
        .attr('transform', \`translate(0, \${params.baseY})\`);

    barsGroup
        .selectAll(".year-label-start")
        .data([data[0]])
        .join("text")
        .attr("class", "year-label-start")
        .attr("x", params.baseX )
        .attr("y", params.baseY - 5)
        .attr("font-size", 12)
        .attr("fill", "#222")
        .attr("text-anchor", "end")
        .text(d => d.year);

    barsGroup
        .selectAll(".year-label-end")
        .data([data[data.length - 1]])
        .join("text")
        .attr("class", "year-label-end")
        .attr("x", params.baseX + params.chartWidth )
        .attr("y", params.baseY - 5)
        .attr("font-size", 12)
        .attr("fill", "#222")
        .attr("text-anchor", "start")
        .text(d => d.year);
}
`
 
const sunset_schema = {
    "global": {
        "svgWidth": 700,
        "svgHeight": 700,
        "svgViewBox": "0 0 700 700",
        "chartWidth": 540,
        "chartHeight": 270,
        "chartOriginX": 80,
        "chartOriginY": 80,
        "coordinateType": "cartesian",
        "chartType": "bar"
    },
    "axis": {
        "xAxisDataAttr": "year",
        "yAxisDataAttr": "value",
        "radiusAxisDataAttr": "",
        "howToLabel": "The x-axis represents years from 2006 to 2010, and the y-axis represents values corresponding to each year.",
        "howToEncode": "The x-axis is encoded by the year labels positioned at the bottom of each bar, while the y-axis is represented by the height of the bars corresponding to the values."
    },
    "dataElementTypes": [
        {
            "tagName": "rect",
            "identifier": ".bar-rect",
            "encodedEleAttrs": [
                {
                    "eleAttr": "height",
                    "dataAttr": "value",
                    "eleAttrRange": [
                        0,
                        270
                    ],
                    "howToEncode": "The height of each bar is determined by the value for each year."
                }
            ],
            "fixedAttr": [
                {
                    "attribute": "width",
                    "value": 45
                },
                {
                    "attribute": "fill",
                    "value": "black"
                }
            ],
            "encodedDataAttr": [
                "value"
            ],
            "howToEncode": "The bars represent the values for each year, with their heights determined by the corresponding data values.",
            "oneExampleElement": "<rect class=\"bar-rect\" x=\"0\" y=\"235.7\" width=\"45\" height=\"34.3\" fill=\"black\"/>"
        },
        {
            "tagName": "text",
            "identifier": ".bar-label",
            "encodedEleAttrs": [
                {
                    "eleAttr": "y",
                    "dataAttr": "value",
                    "eleAttrRange": [
                        0,
                        270
                    ],
                    "howToEncode": "The y position of each label is determined by the corresponding value."
                }
            ],
            "fixedAttr": [
                {
                    "attribute": "text-anchor",
                    "value": "middle"
                },
                {
                    "attribute": "font-size",
                    "value": 12
                },
                {
                    "attribute": "fill",
                    "value": "#222"
                }
            ],
            "encodedDataAttr": [
                "value"
            ],
            "howToEncode": "The text labels are positioned above each bar and display the value for each corresponding year.",
            "oneExampleElement": "<text class=\"bar-label\" x=\"22.5\" y=\"235.71428571428572\" dy=\"-4\">2</text>"
        },
        {
            "tagName": "polygon",
            "identifier": ".bar-shadow",
            "encodedEleAttrs": [
                {
                    "eleAttr": "points",
                    "dataAttr": "",
                    "eleAttrRange": [],
                    "howToEncode": "The shadow polygon is positioned based on the width and height of the corresponding bar."
                }
            ],
            "fixedAttr": [
                {
                    "attribute": "fill",
                    "value": "url(#gradient_classA)"
                },
                {
                    "attribute": "transform",
                    "value": "translate(0,270)"
                }
            ],
            "encodedDataAttr": [],
            "howToEncode": "The polygons create a shadow effect for each bar, enhancing the visual appeal of the chart.",
            "oneExampleElement": "<polygon class=\"bar-shadow\" points=\"0,0 45,0 79.3,34.3 34.3,34.3\"/>"
        }
    ],
    "legend": {
        "mappings": [],
        "locationInSVG": ""
    },
    "annotation": {
        "dataAttrs": [
            "year",
            "value"
        ],
        "howToEncode": "Annotations are represented by the year labels at the bottom of the bars, indicating the corresponding year for each bar."
    }
} as unknown as SchemaResult

const sunset_data = [
    {
        "year": "2006",
        "value": 2
    },
    {
        "year": "2007",
        "value": 5
    },
    {
        "year": "2008",
        "value": 4
    },
    {
        "year": "2009",
        "value": 2
    },
    {
        "year": "2010",
        "value": 7
    }
]

const sunset_params = {
    "xField": "year",
    "yField": "value",
    "chartWidth": 400,
    "chartHeight": 120,
    "colorPalette": [
      "#e63313",
      "#9cbdb5",
      "#eee5d5"
    ],
    "baseY": 270,
    "baseX": 100,
    "alpha": 1.5
  }

const sunset_layered_svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="300px" height="300px" viewBox="0 0 700 700" style="font-family: 'Roboto Mono';" wid="1">
    <defs wid="3">
        <mask id="test-mask" wid="4">
             <rect width="100%" height="100%" x="0" y="0" style="fill: white; opacity: 1;"></rect>
                <rect width="540" height="540" x="0" y="0" fill="black" transform="translate(80,80)"></rect>
        </mask>
    </defs>

    <defs wid="7">
        <linearGradient id="test-gradient" x1="0%" y1="100%" x2="0%" y2="0%" wid="8">
          <stop offset="0%" stop-color="#222" stop-opacity="0"></stop>
                <stop offset="100%" stop-color="#222" stop-opacity="1"></stop>
        </linearGradient>
    </defs>
    <rect width="100%" height="100%" x="0" y="0" fill="#eee5d5" wid="11"/>

    <rect width="540" height="266" x="0" y="0" fill="#9cbdb5" transform="translate(80,80)" wid="12"/>

    <rect width="540" height="270" x="0" y="270" fill="#e63313" transform="translate(80,80)" wid="13"/>

    <circle cx="80" cy="110" r="16" fill="#eee5d5" transform="translate(80,80)" wid="14"/>

    <g id="test-bar-group"  transform="translate(80,80)" wid="15">
       
    </g>

    <g transform="translate(0,0)" wid="43">
        <rect width="100%" height="100%" x="0" y="0" mask="url(#test-mask)" fill="#eee5d5" wid="44"/>
    </g>

    <text x="350" y="40" font-size="12" fill="#333" class="title" style="text-anchor: middle;" wid="45">
        Untitled chart
    </text>
    <text x="350" y="55" font-size="12" fill="#333" class="unit" style="text-anchor: middle;" wid="46">
        (your unit here)
    </text>

    <text x="80" y="640" font-size="12" fill="#333" class="datasrc datasrcStyle" style="text-anchor: start;" wid="47">
        Credit your data source
    </text>
</svg>`

const sunset_dev = {
    schema: sunset_schema,
    data: sunset_data,
    func_string: sunset_plot_string,
    params: sunset_params,
    layeredSvg: sunset_layered_svg
}


export { tableData, sunset_dev };
