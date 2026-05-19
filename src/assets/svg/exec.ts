import store from "../../store"
import { CANVAS_ID } from "../constant/variables"
import * as d3 from "d3"
import { flattenVisLayerGroups, getStandardSvgStr } from "./svg-processing"

export const exec = (svgTemplate: string, code: string, params: Record<string, any>, svgId: string = CANVAS_ID) => {

    const data = store.data.tableData
    const svgRegex = /<svg([\s\S]*?)<\/svg>/;
    const svgMatch = svgTemplate.match(svgRegex);
    if (!svgMatch) return
    
    const svgInnterHTMLRaw = svgMatch[1]
    const idx = svgInnterHTMLRaw.indexOf('>')
    const svgInnterHTML = svgInnterHTMLRaw.substring(idx + 1)
    const roughSvg = svgTemplate.replace(svgInnterHTML, '')

    const svgDoc = new DOMParser().parseFromString(roughSvg, 'image/svg+xml');
    const svgAttributes = svgDoc.documentElement.attributes;
    console.log(svgAttributes)
    for (let i = 0; i < svgAttributes.length; i++) {
        const attr = svgAttributes[i]
        if (attr.name === 'id') continue
        d3.select('#' + svgId).attr(attr.name, attr.value);
    }

    const funcBodyRegex = /{([\s\S]*)}/;
    const match = code.match(funcBodyRegex);
    if (!match) return
    const funcBody = match[1]
    const func = new Function("data", "params", "svgId", "svgTemplate", "d3", funcBody)
    const funcResult = func(data, params, svgId, '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' + svgInnterHTML + '</svg>', d3)
    const serialized = typeof funcResult === 'string'
        ? funcResult
        : new XMLSerializer().serializeToString(funcResult.documentElement)
    const processed = flattenVisLayerGroups(serialized)
    const innerDoc = new DOMParser().parseFromString(processed, 'image/svg+xml')
    d3.select('#' + svgId).html(innerDoc.documentElement.innerHTML)
    
    store.ui.setActiveCanvasTab('canvas')
}