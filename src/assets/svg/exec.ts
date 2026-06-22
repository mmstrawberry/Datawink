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
    if (!match) {
        console.error("exec: could not extract function body from code:", code.substring(0, 200));
        return;
    }
    const funcBody = match[1]
    const func = new Function("data", "params", "svgId", "svgTemplate", "d3", funcBody)
    const templateStr = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' + svgInnterHTML + '</svg>'
    const funcResult = func(data, params, svgId, templateStr, d3)
    console.log("exec: funcResult type:", typeof funcResult, funcResult)

    if (!funcResult) {
        console.error("exec: visualize function returned undefined/null. Code:", code.substring(0, 300));
        return;
    }

    let serialized: string;
    if (typeof funcResult === 'string') {
        serialized = funcResult;
    } else if (funcResult.documentElement) {
        serialized = new XMLSerializer().serializeToString(funcResult.documentElement);
    } else if (funcResult instanceof Element || funcResult instanceof Document) {
        serialized = new XMLSerializer().serializeToString(funcResult);
    } else {
        console.error("exec: unexpected return type from visualize:", typeof funcResult);
        return;
    }
    const processed = flattenVisLayerGroups(serialized)
    const innerDoc = new DOMParser().parseFromString(processed, 'image/svg+xml')
    if (innerDoc.documentElement) {
        d3.select('#' + svgId).html(innerDoc.documentElement.innerHTML)
    }

    store.ui.setActiveCanvasTab('canvas')
}