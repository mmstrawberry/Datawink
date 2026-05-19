import { observer } from "mobx-react";
import SvgTreeViewer from "./SvgTreeViewer";
import store from "../store";
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { CANVAS_ID } from "../assets/constant/variables";
import * as d3 from "d3";



const InspectPanel = observer(() => {
    return (
        <div style={{
            height: '90vh',
            width: '100%',
            position: 'relative',
            scrollbarWidth: 'thin',
            scrollbarColor: '#ebebeb #fff',
            overflowX: 'hidden',
            fontFamily: '"Roboto Mono" !important',
            fontSize: '8px',
        }}>

            <div>
                {/* <Button onClick={async () => {
                    runPipeline();
                }}>
                    Reasoning
                </Button> */}
            </div>
            <SvgTreeViewer/>
            {/* <SvgXMLViewer xml={store.data.layeredSvgString} />

            <Divider />
            <SvgXMLViewer xml={store.svgString} /> */}

            
            <div style={{
                    position: 'absolute',
                    bottom: '0vh',
                    width: '100%',
                    textAlign: 'center',
                }}>
                    <Button type="primary" onClick={() => {
                        // synthesize the svg based on the template, allow user download
                        let svg = d3.select('#' + CANVAS_ID).html()
                        if (!svg) {
                            store.ui.setActiveCanvasTab('canvas')
                            svg = d3.select('#' + CANVAS_ID).html()
                        }
                        const blob = new Blob([svg], { type: 'image/svg+xml' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        const currentTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/[/:\s]/g, match => match === '/' ? '-' : '').replace('AM', '').replace('PM', '').replace(',', '-')
                        a.download = `output_${currentTime}.svg`;
                        a.click();
                        a.remove();
                    }}>
                        <DownloadOutlined />
                        Download the Layered SVG
                    </Button>
                </div>
            
        </div>
    )
});

export default InspectPanel;
