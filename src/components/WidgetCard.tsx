import { observer } from "mobx-react";
import { Card, Col, ColorPicker, Input, InputNumber, Row, Slider, Tooltip } from "antd";
import { NewParamProps } from "../assets/llm/prompt-widget";
import store from "../store";

const blockStyle = {
    // border: '0.5px solid #ccc',
    // borderRadius: '4px',
    // boxShadow: 'rgba(0, 0, 0, 0.1) 0px 0px 10px',
    // paddingLeft: '12px',
    // paddingRight: '12px',
    // paddingBottom: '2px',
    alignItems: 'center',
    // display: 'flex',
    justifyContent: 'space-between',
} as React.CSSProperties

interface WidgetCardProps {
    param: NewParamProps;
}

const WidgetCard = observer(({param}: WidgetCardProps) => <Card
    size="small"
    style={blockStyle}
    title={<>
        <Tooltip placement="topLeft" color="geekblue" title={<span style={{ fontSize: '12px', fontFamily: 'Roboto Mono' }}>{param.key}</span>}>
            {param.alias ? param.alias : param.key}
        </Tooltip>
    </>}
>
    <div>
        {(param.widgetType === 'colorpicker') && (
            <ColorPicker size="small" placement="right" showText
                defaultValue={store.data.params[param.key] as string}
                onChange={(c, css) => {
                    store.data.setParamsByKey(param.key, css)
                    store.addLog({
                        action: `Update ${param.key} to ${css}`,
                        type: 'Update Param'
                    })
                    store.requestExec(false)
                }
                } />
        )}

        {(param.widgetType === 'slider') && (
            <Row gutter={24} style={{
                alignItems: 'center'
            }}>
                <Col span={12}><Slider
                    style={{
                        width: '80px'
                    }}
                    min={parseFloat(String(param.valueRange[0]))}
                    max={parseFloat(String(param.valueRange[1]))}
                    step={(parseFloat(String(param.valueRange[1])) - parseFloat(String(param.valueRange[0]))) / 100}
                    defaultValue={parseFloat(String(store.data.params[param.key]))}
                    value={parseFloat(String(store.data.params[param.key]))}
                    onChange={(v) => {
                        store.data.setParamsByKey(param.key, v)
                        store.addLog({
                            action: `Update ${param.key} to ${v}`,
                            type: 'Update Param'
                        })
                        store.requestExec(false)
                    }
                    } /></Col>
                <Col span={12}>
                    <InputNumber
                        size="small"
                        style={{
                            width: '50px'
                        }}
                        min={parseInt(String(param.valueRange[0]))}
                        max={parseFloat(String(param.valueRange[1]))}
                        step={(parseFloat(String(param.valueRange[1])) - parseFloat(String(param.valueRange[0]))) / 100}
                        defaultValue={parseFloat(String(store.data.params[param.key]))}
                        value={parseFloat(String(store.data.params[param.key]))}
                        onChange={(v) => {
                            store.data.setParamsByKey(param.key, v)
                            store.addLog({
                                action: `Update ${param.key} to ${v}`,
                                type: 'Update Param'
                            })
                            store.requestExec(false)
                        }}
                    />
                </Col>

            </Row>
        )}

        {
            (param.widgetType === 'input') && (param.valueType === 'string') && (
                <Input
                    size="small"
                    defaultValue={store.data.params[param.key]}
                    onChange={(e) => {
                        store.data.setParamsByKey(param.key, e.target.value)
                        store.addLog({
                            action: `Update ${param.key} to ${e.target.value}`,
                            type: 'Update Param'
                        })
                        store.requestExec(false)
                    }}
                />
            )
        }

        {
            (param.widgetType === 'input') && (param.valueType === 'number') && (
                <Row gutter={24} style={{
                    alignItems: 'center'
                }}>
                    <Col span={12}><Slider
                        style={{
                            width: '80px'
                        }}
                        min={parseFloat(String(store.data.params[param.key]))-100}
                        max={parseFloat(String(store.data.params[param.key]))+100}
                        step={1}
                        defaultValue={parseFloat(String(store.data.params[param.key]))}
                        value={parseFloat(String(store.data.params[param.key]))}
                        onChange={(v) => {
                            store.data.setParamsByKey(param.key, v)
                            store.addLog({
                                action: `Update ${param.key} to ${v}`,
                                type: 'Update Param'
                            })
                            store.requestExec(false)
                        }
                        } /></Col>
                    <Col span={12}>
                        <InputNumber
                            size="small"
                            style={{
                                width: '50px'
                            }}
                            step={1}
                            defaultValue={parseFloat(String(store.data.params[param.key]))}
                            value={parseFloat(String(store.data.params[param.key]))}
                            onChange={(v) => {
                                store.data.setParamsByKey(param.key, v)
                                store.addLog({
                                    action: `Update ${param.key} to ${v}`,
                                    type: 'Update Param'
                                })
                                store.requestExec(false)
                            }}
                        />
                    </Col>
                </Row>
            )
        }

        {
            (param.widgetType === 'colorpicker') && (param.valueType === 'Array<string>') && (
                (store.data.params[param.key] as string).split(',').map((c, cid) => {
                    return <div key={cid}>
                        <ColorPicker size="small" placement="right" showText
                            defaultValue={store.data.params[param.key] as string}
                            onChange={(c, css) => {
                                // store.data.setParamsByKey(param.key, css)
                                store.addLog({
                                    action: `Update ${param.key} to ${css}`,
                                    type: 'Update Param'
                                })
                                store.requestExec(false)
                            }
                            } />
                    </div>
                })
            )
        }

    </div>
    <div style={{
        fontSize: '10px',
    }}>
        <span style={{
        }}>{param.widgetDescription}</span>
    </div>



</Card>)

export default WidgetCard;