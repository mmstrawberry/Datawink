import { ChatCompletion } from 'openai/resources/index.mjs';
import store from '../../store'
import { getRenderedSvg, reverseSvg } from '../svg/svg-processing';
import { getObservePrompt, observeFormat, ObserveResult } from './prompt-observe';
import getChatCompletion from '.';
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
        .then((res: ChatCompletion) => {
            store.addLLMLog(observePrompts, res, obsTime);
            const jsonStr = res.choices[0].message.content || "";
            try {
            const jsonObj = JSON.parse(jsonStr) as ObserveResult;
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
      .then((res: ChatCompletion) => {
        store.addLLMLog(semanticPrompts, res, semanticTime);
        const jsonStr = res.choices[0].message.content || "";
        const jsonObj = JSON.parse(jsonStr) as SemanticResult
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
        .then((res: ChatCompletion) => {
            store.addLLMLog(dataPrompt, res, dataTime);
            const jsonStr = res.choices[0].message.content || "";
            try{
                const jsonObj = JSON.parse(jsonStr) as LiteralDataFormat;
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
        .then((res: ChatCompletion) => {
            store.addLLMLog(schemaPrompt, res, schemaTime);
            const jsonStr = res.choices[0].message.content || "";
            try {
                const jsonObj = JSON.parse(jsonStr) as SchemaResult;
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
        .then((res: ChatCompletion) => {
            store.addLLMLog(generatorPrompt, res, generatorTime);
            const jsonStr = res.choices[0].message.content || "";
            try {
                const jsonObj = JSON.parse(jsonStr) as GeneratorResult;
                return jsonObj;
            } catch (error) {
                console.error("Error parsing JSON:", error);
                store.ui.notify("Error: " + error.message);
            }
        })
    console.log(generatorJsonObj)
    store.data.setCode(generatorJsonObj.code)
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
    const prompt = getWidgetPrompt(code, svgString, data, params, schema, usrPrompt, imageData)
    const apiKey = store.apiKey
    console.log('send request to update the widget', svgString.length)
    
    const widgetJsonObj = await getChatCompletion(prompt, apiKey, WidgetResultSchema).then((res)=>{
        store.addLLMLog(prompt, res, new Date())
        const jsonStr = res.choices[0].message.content || ""
        const jsonObj = JSON.parse(jsonStr) as WidgetResult;
        return jsonObj;
    })
    console.log(widgetJsonObj)
    store.data.setCode(widgetJsonObj.code)
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
