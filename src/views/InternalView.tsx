import { observer } from "mobx-react";
import { JsonTree } from 'react-editable-json-tree';
import { Splitter } from "antd";
import store from "../store";
import { Session } from "../assets/constant/types";
import beautify from 'xml-beautifier';



const InternalView = observer(() => {
    return (
        <Splitter style={{ height: '100%' }}>
            <Splitter.Panel collapsible defaultSize={'50%'} style={{ padding: '12px' }}>
                <JsonTree
                    data={{
                        layeredSvg: beautify(store.data.layeredSvgString),
                        llm: store.llmLogs
                    }}
                    readOnly={false}
                    onUpdate={(newData: any) => {
                        store.data.layeredSvgString = newData.layeredSvg
                        store.llmLogs = newData.llm
                    }}
                />
            </Splitter.Panel>
            <Splitter.Panel collapsible style={{ padding: '12px' }}>
                <JsonTree
                    data={store.history}
                    getValueRenderer={(raw: any) => {
                        if (typeof raw === 'string' && raw.length > 50) {
                            return <span>{raw.substring(0, 50) + '...'}</span>;
                        }
                        return raw;
                    }}
                    onUpdate={(newHistory: Session[]) => {
                        const history = newHistory.filter((h: Session | null) => h !== null);
                        store.setHistory([...history]);
                    }}
                    onError={(err: Error) => {
                        console.error(err);
                    }}
                />
            </Splitter.Panel>
        </Splitter>
    )
})

export default InternalView;