import { SchemaResult } from "./types"
import { sunset_dev } from "./dev"

export interface DevProps {
    schema: SchemaResult
    data: Record<string, string | number>[]
    func_string: string
    params: Record<string, string | any>
    layeredSvg: string
}
export interface ExampleProps {
    title?: string,
    description?: string,
    source: string,
    preview: string,
    svg?: string,
    prototype?: string,
    author: string,
    devProps?: DevProps
}
export const EXAMPLES: ExampleProps[] = [
    {
        title: "Window",
        description: "Blending bars into window with reflection",
        source: "https://plotparade.com/55_window/",
        author: "Krisztina Szucs",
        preview: "bar-window/preview-bar-window.png",
        svg: "bar-window/bar-window.svg",
        prototype: "bar"
    }, {
        title: "[Demo] Sunset",
        description: "Use bar chart as sunset",
        source: "https://plotparade.com/15_sunset/",
        author: "Krisztina Szucs",
        preview: "bar-sunset/preview-bar-sunset.png",
        svg: "bar-sunset/bar-sunset.svg",
        prototype: "bar",
        devProps: sunset_dev
    }
]