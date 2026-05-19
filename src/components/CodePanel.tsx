import { observer } from "mobx-react"
import { useState } from "react"
import store from "../store"
import CodeEditor from "./CodeEditor"
import { Button, Splitter } from "antd"
import { JsonTree } from 'react-editable-json-tree';
import { RocketOutlined } from "@ant-design/icons"

const CodePanel = observer(() => {
    const [dividerTopPercent, setDividerTopPercent] = useState(55)

    const handleResize = (sizes: number[]) => {
        const total = sizes.reduce((sum, n) => sum + n, 0)
        if (total > 0) {
            setDividerTopPercent((sizes[0] / total) * 100)
        }
    }

    return (
        <div className="code-panel" style={{ position: 'relative', height: '100%', width: '100%' }}>
            <Splitter
                layout="vertical"
                style={{ height: '100%' }}
                onResize={handleResize}
            >
                <Splitter.Panel defaultSize="55%" min={120}>
                    <div style={{ height: '100%', minHeight: 0 }}>
                        <CodeEditor />
                    </div>
                </Splitter.Panel>
                <Splitter.Panel defaultSize="45%" min={80}>
                    <div style={{
                        height: '100%',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                    }}>
                        <JsonTree
                            data={store.data.params}
                            onUpdate={(newParams: Record<string, string | number>) => {
                                console.log('newParams', newParams)
                                store.addLog({
                                    action: `Update params: ${JSON.stringify(newParams)}`,
                                    type: 'Update Params'
                                })
                                store.data.setParams(newParams)
                                store.requestExec(false)
                            }}
                            onError={(err: Error) => {
                                console.error(err);
                                store.ui.notify(err.message);
                            }}
                        />
                    </div>
                </Splitter.Panel>
            </Splitter>
            <div
                className="code-panel-divider-btn"
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: `${dividerTopPercent}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    pointerEvents: 'none',
                }}
            >
                <Button
                    type="primary"
                    size="middle"
                    icon={<RocketOutlined />}
                    onClick={() => store.requestExec(true)}
                    style={{ pointerEvents: 'auto' }}
                >
                    Update
                </Button>
            </div>
        </div>
    )
})

export default CodePanel
