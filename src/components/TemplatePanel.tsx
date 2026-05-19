import { Button, Card, Col, ColorPicker, Divider, Dropdown, Flex, Input, InputNumber, MenuProps, Row, Slider, Space, Tooltip } from "antd";
import { observer } from "mobx-react";
import { RocketOutlined, DownOutlined, InfoOutlined, InfoCircleOutlined } from "@ant-design/icons";
import store from "../store";
import * as d3 from "d3";
import { useEffect, useState } from "react";
import { JsonTree } from 'react-editable-json-tree';
import { NewParamProps } from "../assets/llm/prompt-widget";
import { set } from "mobx";
import WidgetCard from "./WidgetCard";

const dividerStyle = {
    marginTop: '16PX',
    marginBottom: '4px',
    borderColor: 'rgb(170, 34, 243)',
    borderWidth: '4px !important',
    fontWeight: '550',
    color: 'rgb(170, 34, 243)',
    fontSize: '15px'

} as React.CSSProperties

const eleDivStyle = {
    paddingLeft: '12px',
    paddingRight: '12px',
    paddingTop: '8px',
    paddingBottom: '8px',
    border: '1px dashed rgb(219, 219, 219)',
    boxShadow: 'rgba(0, 0, 0, 0.07) 0px 0px 8px',
    borderRadius: '4px',
    marginBottom: '8px',
} as React.CSSProperties


const TemplatePanel = observer(() => {
    const [fillColors, setFillColors] = useState([] as Array<string | null>)
    const [strokeColors, setStrokeColors] = useState([] as Array<string | null>)
    const [strokeWidths, setStrokeWidths] = useState([] as Array<string | null>)

    return (
        <div style={{ height: '92vh', width: '100%', position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
            <div style={{
                height: '90vh',
                overflowY: 'auto',
                overflowX: 'hidden',
            }}>
                <Divider plain style={dividerStyle} orientation="left">
                    <span>Global Layout</span>
                </Divider>

                {store.data.schema.global?.coordinateType === 'cartesian' && (
                    <>
                        <div style={{ paddingLeft: '12px', paddingRight: '12px' }}>
                            <Row gutter={[2, 4]}>
                                <Col span={24}>
                                    <Row align="middle">
                                        <Col span={4}>X Axis</Col>
                                        <Col span={8}>
                                            <Dropdown menu={{
                                                items: store.data.tableData.length > 0 ? Object.keys(store.data.tableData[0]).map(v => ({
                                                    key: v,
                                                    label: v
                                                })) : []
                                            }}>
                                                <a onClick={(e) => e.preventDefault()}>
                                                    <span style={{ fontSize: '16px' }}>{store.data.params.xField}</span>
                                                    <DownOutlined />
                                                </a>
                                            </Dropdown>
                                        </Col>
                                        <Col span={4}>Y Axis</Col>
                                        <Col span={8}>
                                            <Dropdown menu={{
                                                items: store.data.tableData.length > 0 ? Object.keys(store.data.tableData[0]).map(v => ({
                                                    key: v,
                                                    label: v
                                                })) : []
                                            }}>
                                                <a onClick={(e) => e.preventDefault()}>
                                                    <span style={{ fontSize: '16px' }}>{store.data.params.yField}</span>
                                                    <DownOutlined />
                                                </a>
                                            </Dropdown>
                                        </Col>
                                    </Row>
                                </Col>

                                <Col span={24}>
                                    <Row align="middle">
                                        <Col span={4}>Origin X</Col>
                                        <Col span={8}>
                                            <InputNumber
                                                size="small"
                                                value={store.data.params?.chartOriginX}
                                                onChange={(v) => {
                                                    store.data.setParamsByKey('chartOriginX', v)
                                                    store.addLog({
                                                        action: `Update Origin X to ${v}`,
                                                        type: 'Update Param'
                                                    })
                                                    store.requestExec(false)
                                                }}
                                            />
                                        </Col>
                                        <Col span={4}>Origin Y</Col>
                                        <Col span={8}>
                                            <InputNumber
                                                size="small"
                                                value={store.data.params.chartOriginY}
                                                onChange={(v) => {
                                                    store.data.setParamsByKey('chartOriginY', v)
                                                    store.addLog({
                                                        action: `Update Origin Y to ${v}`,
                                                        type: 'Update Param'
                                                    })
                                                    store.requestExec(false)
                                                }}
                                            />
                                        </Col>
                                    </Row>
                                </Col>

                                <Col span={24}>
                                    <Row align="middle">
                                        <Col span={4}>Chart Width</Col>
                                        <Col span={8}>
                                            <InputNumber
                                                size="small"
                                                value={store.data.schema?.global.chartWidth}
                                                onChange={(v) => {
                                                    store.data.setParamsByKey('chartWidth', v)
                                                    store.addLog({
                                                        action: `Update Chart Width to ${v}`,
                                                        type: 'Update Param'
                                                    })
                                                    store.requestExec(false)
                                                }}
                                            />
                                        </Col>
                                        <Col span={4}>Chart Height</Col>
                                        <Col span={8}>
                                            <InputNumber
                                                size="small"
                                                value={store.data.schema?.global.chartHeight}
                                                onChange={(v) => {
                                                    store.data.setParamsByKey('chartHeight', v)
                                                    store.addLog({
                                                        action: `Update Chart Height to ${v}`,
                                                        type: 'Update Param'
                                                    })
                                                    store.requestExec(false)
                                                }}
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>

                            <Row style={{ marginTop: '4px' }}>
                                <Col span={4}>

                                    SVG Width
                                </Col>
                                <Col span={8}>
                                    <InputNumber
                                        size="small"
                                        value={store.data.schema?.global.svgWidth}
                                    />                            </Col>
                                <Col span={4}>
                                    SVG Height
                                </Col>
                                <Col span={8}>
                                    <InputNumber
                                        size="small"
                                        value={store.data.schema?.global.svgHeight}
                                    />
                                </Col>
                            </Row>
                        </div>

                        <Divider plain style={dividerStyle} orientation="left">
                            <span>Data-Driven Elements</span>
                        </Divider>
                        {
                            store.data.schema?.dataElementTypes.map((element, idx) => {
                                return (
                                    <div key={idx} style={eleDivStyle}>
                                        <div onMouseEnter={() => {
                                            const eles = d3.selectAll(`${element.identifier}`)
                                            const nodes = eles.nodes() as unknown as Element[]
                                            const fillColors = nodes.map(node => node.getAttribute('fill') || null)
                                            const strokeColors = nodes.map(node => node.getAttribute('stroke') || null)
                                            const strokeWidths = nodes.map(node => node.getAttribute('stroke-width') || null)
                                            setFillColors(fillColors)
                                            setStrokeColors(strokeColors)
                                            setStrokeWidths(strokeWidths)

                                            eles.attr("fill", "yellow")
                                            eles.attr("stroke", "yellow")
                                            eles.attr("stroke-width", "5")
                                        }} onMouseOut={() => {
                                            const eles = d3.selectAll(`${element.identifier}`)

                                            eles.attr("fill", (_, idx) => fillColors[idx])
                                            eles.attr("stroke", (_, idx) => strokeColors[idx])
                                            eles.attr("stroke-width", (_, idx) => strokeWidths[idx])

                                        }}>
                                            <span className="template-element-name">{element.tagName}</span>
                                            &nbsp;
                                            <span className="template-element-identifier">{element.identifier}</span>
                                            &nbsp;
                                            <Tooltip placement="right" title={element.encodedEleAttrs.map(attr => attr.howToEncode).join('\n')}>
                                                <span><InfoCircleOutlined style={{ color: 'steelblue', fontSize: '12px' }} /></span>
                                            </Tooltip>
                                            &nbsp;&nbsp;&nbsp;
                                            {element.encodedEleAttrs.map((attr, aid) => {
                                                return <div key={aid}>
                                                    <span><span className="template-element-attr-encoded" key={aid}>{attr.eleAttr}</span></span>



                                                </div>
                                            })}
                                        </div>
                                        {/* <div style={{marginTop: '4px'}}>
                                            <Flex gap="small" wrap>
                                                { element.encodedEleAttrs.map((attr, aid) =>{
                                                    return <>
                                                       <span><span className="template-element-attr-encoded" key={aid}>{attr.eleAttr}</span>&nbsp;&nbsp;{attr.dataAttr}</span>
                                                        
                                
                    
                                                    </>
                                                })}
                                            </Flex>
                                           
                                        </div> */}
                                        <div>
                                            <Flex gap="small" wrap>
                                                {
                                                    element.fixedAttr.map((attr, aid) => {
                                                        return <span key={aid}><span className="template-element-attr" key={aid}>{attr.attribute}</span>&nbsp;&nbsp;{attr.value}</span>
                                                    })
                                                }
                                            </Flex>
                                        </div>
                                    </div>

                                )
                            })
                        }

                        <Divider plain style={dividerStyle} orientation="left">
                            <span>Dynamic Parameters</span>
                            &nbsp;<Tooltip title="The following parameters are dynamically generated based on your request." placement="right"><InfoCircleOutlined style={{ color: 'steelblue', fontSize: '12px' }} /></Tooltip>
                        </Divider>
                        {/* <div>
                            <span style={{fontStyle: 'italic', paddingLeft: '12px', color: 'rgb(136, 136, 136)'}}>
                                The following parameters are dynamically generated based on your request.
                            </span>
                        </div> */}


                        <Flex wrap gap="small" align="center">
                                {   store.data.newParams.map((param, idx) => {
                                        return <WidgetCard 
                                            key={idx} 
                                            param={param} 
                                            />
                                    }
                                )}
                        </Flex>

                        {store.mode === 'dev' && <JsonTree
                            data={store.data.newParams}
                            isCollapsed={(val: any) => {
                                if (typeof (val) === 'string' && val.length > 10) return true
                                return false
                            }}
                            onUpdate={(newParams: NewParamProps[]) => {
                                console.log('newParams', newParams)
                                newParams.forEach((param: NewParamProps) => {
                                    const name = param.key
                                    store.data.setParamsByKey(name, param.defaultValue)
                                })
                                store.data.setNewParams([...newParams])
                                store.addLog({
                                    action: `Update new params: ${JSON.stringify(newParams)}`,
                                    type: 'Update Params'
                                })
                                store.requestExec(false)
                            }}
                            onError={(err: Error) => {
                                console.error(err);
                                store.ui.notify(err.message);
                            }}
                        />}

                    </>
                )}
                {
                    store.data.schema.global?.coordinateType === 'polar' && (
                        <div>
                            <span>Polar Chart</span>
                        </div>
                    )
                }
            </div>

            <div style={{
                position: 'absolute',
                bottom: '0vh',
                textAlign: 'center',
                width: '100%',
            }}>
                <Button type="primary" onClick={() => store.requestExec(true)}>
                    <RocketOutlined />
                    Update
                </Button>
            </div>
        </div>
    );
});

export default TemplatePanel;