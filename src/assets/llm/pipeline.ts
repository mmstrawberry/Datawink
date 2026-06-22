import store from '../../store'
import { getRenderedSvg, reverseSvg } from '../svg/svg-processing';
import { getObservePrompt, observeFormat, ObserveResult } from './prompt-observe';
import getChatCompletion, { ChatResult } from './index';
import { generatorFormat, GeneratorResult, getGeneratorPrompt } from './prompt-generator';
import { DataFormat, dataFormat, getDataTablePrompt, LiteralDataFormat } from './prompt-data';
import { getSemanticPrompt, semanticFormat, SemanticResult } from './prompt-semantic';
import { getSchemaPrompt, schemaFormat } from './prompt-schema';
import { SchemaResult } from '../constant/types';
import { CANVAS_ID, PLOT_CANVAS_ID } from '../constant/variables';
import { getWidgetPrompt, WidgetResult, WidgetResultSchema } from './prompt-widget';

const downloadTxt = (content: string, fileName: string='log') => {
    const currentTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/[/:\s]/g, match => match === '/' ? '-' : '').replace('AM', '').replace('PM', '').replace(',', '-')
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}-${currentTime}.txt`;
    a.click();
    a.remove();
}

const parseInferredDataRows = (jsonifiedDatumArray: unknown): Record<string, number | string>[] => {
    let rawRows: unknown[] = [];
    if (Array.isArray(jsonifiedDatumArray)) {
        rawRows = jsonifiedDatumArray;
    } else if (typeof jsonifiedDatumArray === "string") {
        const parsed = JSON.parse(jsonifiedDatumArray);
        rawRows = Array.isArray(parsed) ? parsed : [parsed];
    } else if (jsonifiedDatumArray && typeof jsonifiedDatumArray === "object") {
        rawRows = [jsonifiedDatumArray];
    }
    const rows = rawRows.map((row) => {
        if (typeof row === "string") {
            return JSON.parse(row) as Record<string, number | string>;
        }
        return row as Record<string, number | string>;
    });

    return rows.filter((row) => row && typeof row === "object");
};


// 清理 code 字段中可能的 markdown 代码块包裹
const cleanCodeString = (code: string): string => {
    if (!code) return code;
    let cleaned = code.trim();
    // Remove ```javascript ... ``` or ```js ... ``` wrapping
    const fenced = cleaned.match(/^```(?:javascript|js)?\s*\n?([\s\S]*?)\n?```$/);
    if (fenced) {
        cleaned = fenced[1].trim();
    }
    // Ensure the code contains a function body
    if (!cleaned.includes('{') || !cleaned.includes('}')) {
        console.warn("cleanCodeString: code may not be valid JavaScript:", cleaned.substring(0, 200));
    }
    return cleaned;
};

// 从 LLM 响应中提取 JSON 对象（处理可能的 markdown 包裹）
const extractJsonFromResponse = (content: string): any => {
    // 尝试直接解析
    try {
        return JSON.parse(content);
    } catch { }

    // 尝试提取 ```json ... ``` 块
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[1].trim());
        } catch { }
    }

    // 尝试找到第一个 { 和最后一个 }
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        try {
            return JSON.parse(content.substring(firstBrace, lastBrace + 1));
        } catch { }
    }

    throw new Error("Failed to extract JSON from response: " + content.substring(0, 200));
};


const runReverseEngineering = async (needLog: boolean = false) => {

    const apiKey = store.apiKey;
    const imageData = await getRenderedSvg(store.rawString, PLOT_CANVAS_ID).then((d)=> d, (err) => {
        console.error("Error rendering SVG:", err);
        store.ui.notify("Error: " + err.message);
        return null;
    });
    if (!imageData) return;

    // Abs 1. Layer Extraction
    const observePrompts = getObservePrompt(store.data.refString, imageData);
    const obsTime = new Date();
    console.log('observe prompts', observePrompts)
    const obsJsonObj = await getChatCompletion(observePrompts, apiKey, observeFormat)
        .then((res: ChatResult) => {
            store.addLLMLog(observePrompts, res, obsTime);
            const jsonStr = res.choices[0].message.content || "";
            try {
            const jsonObj = extractJsonFromResponse(jsonStr) as ObserveResult;
            return jsonObj;
            } catch (err) {
                console.error("Error parsing JSON:", err);
                store.ui.notify("Error: " + err.message);
                return null;
            }
        }, (err) => {
            console.error("Error in observe:", err);
            store.ui.notify("Error: " + err.message);
            return null;
        })
    if (!obsJsonObj) return
    const layeredSvg = obsJsonObj.layeredSvg
    store.data.setLayeredSvgString(obsJsonObj.layeredSvg);
    const cleanSvg = reverseSvg(store.data.refString, obsJsonObj.layeredSvg);
    store.data.setCleanSvg(cleanSvg);

    // Abs 2. Semantic Enrichment
    const semanticPrompts = getSemanticPrompt(obsJsonObj.layeredSvg, imageData);
    const semanticTime = new Date();
    const semanticJsonObj = await getChatCompletion(semanticPrompts, apiKey, semanticFormat)
      .then((res: ChatResult) => {
        store.addLLMLog(semanticPrompts, res, semanticTime);
        const jsonStr = res.choices[0].message.content || "";
        const jsonObj = extractJsonFromResponse(jsonStr) as SemanticResult
        return jsonObj;
      }).catch((err) => {
        console.error(err);
        store.ui.notify("Error: " + err.message)
      })
      console.log(semanticJsonObj)


    const semanticSvg = (semanticJsonObj as SemanticResult)?.extendedSvg || layeredSvg
    // Abs 3. Visual Structure Understanding
    const dataPrompt = getDataTablePrompt(semanticSvg, imageData);
    const dataTime = new Date();
    const dataJsonObj = await getChatCompletion(dataPrompt, apiKey, dataFormat)
        .then((res: ChatResult) => {
            store.addLLMLog(dataPrompt, res, dataTime);
            const jsonStr = res.choices[0].message.content || "";
            try{
                const jsonObj = extractJsonFromResponse(jsonStr) as LiteralDataFormat;
                return jsonObj;
            } catch (error) {
                console.error("Error parsing JSON:", error);
                store.ui.notify("Error: " + error.message);
            }
        })
    console.log(dataJsonObj)
    if (!dataJsonObj) return;
    let inferredData: Record<string, number | string>[] = [];
    try {
        inferredData = parseInferredDataRows(dataJsonObj.jsonifiedDatumArray);
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error("Error parsing inferred data rows:", {
            error,
            raw: dataJsonObj?.jsonifiedDatumArray,
        });
        store.ui.notify("Error parsing inferred data: " + errMsg);
        return;
    }
    if (inferredData.length === 0) {
        store.ui.notify("Error parsing inferred data: no valid rows returned");
        return;
    }
    store.updateInferredTableData(inferredData)
    const inferredDataStr = JSON.stringify(inferredData)

    const schemaPrompt = getSchemaPrompt(layeredSvg, imageData, inferredDataStr);
    const schemaTime = new Date();
    const schemaJsonObj = await getChatCompletion(schemaPrompt, apiKey, schemaFormat)
        .then((res: ChatResult) => {
            store.addLLMLog(schemaPrompt, res, schemaTime);
            const jsonStr = res.choices[0].message.content || "";
            try {
                const jsonObj = extractJsonFromResponse(jsonStr) as SchemaResult;
                return jsonObj;
            } catch (error) {
                console.error("Error parsing JSON:", error);
                store.ui.notify("Error: " + error.message);
            }
        })
    console.log(inferredData)
    console.log(schemaJsonObj)
    store.data.setSchema(schemaJsonObj)
    store.data.setTableData(inferredData)

    // Generate the code based on the schema
    const generatorPrompt = getGeneratorPrompt(layeredSvg, inferredData, JSON.stringify(schemaJsonObj), imageData);
    const generatorTime = new Date();
    const generatorJsonObj = await getChatCompletion(generatorPrompt, apiKey, generatorFormat)
        .then((res: ChatResult) => {
            store.addLLMLog(generatorPrompt, res, generatorTime);
            const jsonStr = res.choices[0].message.content || "";
            try {
                const jsonObj = extractJsonFromResponse(jsonStr) as GeneratorResult;
                return jsonObj;
            } catch (error) {
                console.error("Error parsing JSON:", error);
                store.ui.notify("Error: " + error.message);
            }
        })
    console.log(generatorJsonObj)
    store.data.setCode(cleanCodeString(generatorJsonObj.code))
    // update the svg template
    store.data.setParams(JSON.parse(generatorJsonObj.defaultParamsJsonStr))


    if (!needLog) return
    const logStr = `${generatorJsonObj.code}

${generatorJsonObj.svgTemplate}

${JSON.stringify(JSON.parse(generatorJsonObj.defaultParamsJsonStr), null, 2)}

${JSON.stringify(schemaJsonObj, null, 2)}
`
    downloadTxt(logStr, 're-log')
}

const synthesizeWidget = async (usrPrompt: string, svgString: string, needLog: boolean = false) => {
    const imageData = await getRenderedSvg(svgString, PLOT_CANVAS_ID)
    const code = store.data.code
    const params = store.data.params
    const schema = store.data.schema
    const data = store.data.tableData
    const layeredSvg = store.data.layeredSvgString
    const prompt = getWidgetPrompt(code, layeredSvg, data, params, schema, usrPrompt, imageData)
    const apiKey = store.apiKey
    console.log('send request to update the widget', svgString.length)

    const widgetJsonObj = await getChatCompletion(prompt, apiKey, WidgetResultSchema).then((res)=>{
        store.addLLMLog(prompt, res, new Date())
        const jsonStr = res.choices[0].message.content || ""
        const jsonObj = extractJsonFromResponse(jsonStr) as WidgetResult;
        return jsonObj;
    })
    console.log(widgetJsonObj)
    store.data.setCode(cleanCodeString(widgetJsonObj.code))
    store.data.setParams(JSON.parse(widgetJsonObj.defaultParamsJsonStr))
    store.data.addNewParams(widgetJsonObj.newParamsIntro)
    const newData = JSON.parse(widgetJsonObj.newDataJsonStr)
    store.updateLastLLMMsg(widgetJsonObj.response)
    store.updateInferredTableData(newData)
    store.ui.setIsQuerying(false)

    if (!needLog) return
    const logStr = `
${widgetJsonObj.response}

${widgetJsonObj.code}

${JSON.stringify(JSON.parse(widgetJsonObj.defaultParamsJsonStr), null, 2)}

${JSON.stringify(widgetJsonObj.newParamsIntro, null, 2)}

${JSON.stringify(JSON.parse(widgetJsonObj.newDataJsonStr), null, 2)}
`
    downloadTxt(logStr, 're-log')
}


export {
    runReverseEngineering,
    synthesizeWidget
}
