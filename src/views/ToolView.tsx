import { Flex, Splitter, Segmented } from "antd";
import UploadPanel from "../components/UploadPanel";
import SvgCanvas from "../components/SvgCanvas";
import store from "../store";
import { observer } from "mobx-react";
import { Chatbox } from "../components/Chatbox";
import ApiPanel from "../components/ApiPanel";
import InspectPanel from "../components/InspectPanel";
import TableEditor from "../components/TableEditor";
import TemplatePanel from "../components/TemplatePanel";
import { ClusterOutlined, CodeOutlined, SnippetsOutlined, UnorderedListOutlined } from '@ant-design/icons';
import CodePanel from "../components/CodePanel";
import { JsonTree } from 'react-editable-json-tree';
import { useState, useRef, useEffect } from 'react';


const panelStyle: React.CSSProperties = {
    padding: '12px',
    scrollbarWidth: 'none'
}

const ToolView: React.FC = observer(() => {
    const [canvasContainerSize, setCanvasContainerSize] = useState({ width: 0, height: 0 });
    const canvasPanelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!canvasPanelRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setCanvasContainerSize({ width, height });
            }
        });

        resizeObserver.observe(canvasPanelRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <Splitter style={{ height: '100%', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
            <Splitter.Panel collapsible defaultSize={'30%'}>
                <Splitter 
                layout="vertical"
                onResize={(sizes: number[]) => {
                    console.log('size', sizes);
                  
                }}
                >
                    <Splitter.Panel
                        collapsible
                        defaultSize={'55%'}
                        style={panelStyle}
                    >
                        <div ref={canvasPanelRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Flex style={{ marginBottom: '4px', flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 100 }}
                            justify="space-evenly"
                            align="start"
                            gap={'small'}
                        >
                            <UploadPanel />
                            <ApiPanel />
                        </Flex>

                        <SvgCanvas
                            svgString={store.svgString}
                            containerWidth={canvasContainerSize.width}
                            containerHeight={canvasContainerSize.height}
                        />
                        </div>

                    </Splitter.Panel>

                    <Splitter.Panel collapsible style={panelStyle}>
                        <TableEditor />
                    </Splitter.Panel>

                </Splitter>

            </Splitter.Panel>

            <Splitter.Panel collapsible defaultSize={'40%'}>
                <Splitter layout="vertical" style={{ height: '100%' }}>
                    <Splitter.Panel collapsible style={{ ...panelStyle, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{
                            textAlign: 'center',
                            flexShrink: 0,
                        }}>
                            <Segmented
                                value={store.ui.configMode}
                                style={{
                                    marginBottom: 10,
                                    marginLeft: 'auto',
                                    marginRight: 'auto',
                                }}
                                onChange={(value) => { store.ui.setConfigMode(value) }}
                                options={[{
                                    label: 'Template',
                                    icon: <UnorderedListOutlined />,
                                    value: 'Template'
                                }, {
                                    label: 'Structure',
                                    icon: <ClusterOutlined />,
                                    value: 'Structure'
                                }, {
                                    label: 'Outline',
                                    icon: <SnippetsOutlined />,
                                    value: 'Outline'
                                }, {
                                    label: 'Program',
                                    icon: <CodeOutlined />,
                                    value: 'Program'
                                }]}
                            />
                        </div>

                        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                        {/* {store.ui.configMode === 'Data' && <TableEditor />} */}
                        {store.ui.configMode === 'Template' && <TemplatePanel />}
                        {store.ui.configMode === 'Structure' && <InspectPanel />}
                        {store.ui.configMode === 'Outline' && <>
                            <div style={{
                                height: '90vh',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                            }}>
                            <JsonTree
                                data={store.data.schema}
                                isCollapsed={(val: any) => {
                                    if (typeof (val) === 'string' && val.length > 10) return true
                                    return false
                                }}
                                onUpdate={(newParams: any) => {
                                }}
                                onError={(err: Error) => {
                                    console.error(err);
                                    store.ui.notify(err.message);
                                }}
                            />

                    
                        </div>    </>}
                        
                        {store.ui.configMode === 'Program' && <CodePanel />}
                        </div>

                    </Splitter.Panel>

                </Splitter>
            </Splitter.Panel>
            <Splitter.Panel collapsible>
                <Chatbox />
            </Splitter.Panel>
        </Splitter>
    )
});

export default ToolView;

