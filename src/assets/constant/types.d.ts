import { NewParamProps } from "../llm/prompt-widget";
import { AnthropicMessageParam } from "../llm/index";

/**
 * @description Chat message structure
 */
export interface Chat2GPT {
    role: "system" | "user" | "assistant" | "log" | "tool";
    content: string;
    newWidgets?: Array<NewParamProps>;
}


export type ChatboxMsg = UsrMsg | ResMsg

export interface UsrMsg extends Chat2GPT {
    selection?: Array<string>
}

export interface ResMsg extends Chat2GPT {
    encoding?: Array<string>

}

export interface SessionLogRaw {
    action: string,
    type: string,
}

export interface SessionLog extends SessionLogRaw {
    time: string,
}

export interface Session {
    id: string,
    logs: Array<SessionLog>,
    baseSvg: string,
    versions: SessionVersion[]
}

export interface SessionVersion {
    id: string,
    alias: string,
    description: string,
    /** When this snapshot was bookmarked (locale string, same style as session logs). */
    savedAt?: string,
    layeredSvg: string,
    code: string,
    params: Record<string, string | number>,
    schema: Record<string, string | any>,
    data: Array<Record<string, string | number>>
    widget: Array<any>
}

export interface LLMLog {
    query: AnthropicMessageParam[],
    response: object | string,
    token: {
        total: number,
        prompt: number,
        cache?: number,
        completion: number
    }
    duration?: number
    cost?: number
}


export interface DataDrivenElementSpec {
    tagName: string;
    identifier: string;
    encodedSvgAttr: {
        eleAttr: string;
        dataAttr: string;
        eleAttrRange: string[] | number[];
        howToEncode: string;
    }[];
    fixedAttr: {
        attribute: string;
        value: string | number;
    }[];
    oneExampleElement: string;
}

export interface GlobalSpec {
    svgWidth: number;
    svgHeight: number;
    chartWidth: number;
    chartHeight: number;
    chartOriginX: string;
    chartOriginY: string;
    coordinateType: 'cartesian' | 'polar' | 'others';
    chartType: 'bar' | 'line' | 'scatter' | 'others';
}

export interface AxisSpec {
    xAxisDataAttr: string;
    yAxisDataAttr: string;
    radiusAxisDataAttr: string;
    howToEncode: string;
}

export interface LegendSpec {
    mappings: {
        dataAttr: string;
        valueRange: string[] | number[];
        howToEncode: string;
    }[];
    locationInSVG: string;
}

export interface AnnotationSpec {
    dataAttr: string[];
    howToEncode: string;
}



export interface SchemaResult {
    global: GlobalSpec;
    dataElementTypes: DataDrivenElementSpec[];
    axis: AxisSpec;
    legend: LegendSpec;
    annotation: AnnotationSpec;
}