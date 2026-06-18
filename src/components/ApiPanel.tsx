import { Button, Input, Space, notification } from "antd";
import OpenAI from "openai";
import { useState } from "react";
import store from "../store";
import { KeyOutlined } from "@ant-design/icons";

const ApiPanel = () => {
    const [api, contextHolder] = notification.useNotification();
    const [localKey, setLocalKey] = useState<string>('');
    const [isConfig, setIsConfig] = useState<boolean>(false);

    const openErrorNotification = (msg: string) => {
        api.error({
            message: `Error`,
            description: `${msg}`,
            placement: 'top',
        });
    }

    const openSuccessNotification = (msg: string) => {
        api.success({
            message: `Success`,
            description: `${msg}`,
            placement: 'top',
        });
    }

    const checkApiKey = (apiKey: string) => {
        if (apiKey.length < 10) {
            openErrorNotification("API Key is not valid.");
            return;
        }
        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://api.xiaomimimo.com/v1",
            dangerouslyAllowBrowser: true
        })
        openai.chat.completions.create({
            model: "mimo-v2.5-pro",
            messages: [{role: "user", content: "Hello, world!"}]
        }).then((response) => {
            try {
                if (response.choices[0].message.content) {
                    openSuccessNotification("API Key is valid.");
                    store.updateApiKey(apiKey);
                    setIsConfig(false);
                    return true;
                }
            } catch (error) {
                openErrorNotification(`API Key is not valid. ${error}`);
            }
        }).catch((error) => {
            openErrorNotification(`API Key is not valid. ${error}`);
        })
    }

    return (<>
    {contextHolder}
         <Space direction="vertical" size="middle" style={{ width: '100%', flex: 1 }}>
            { isConfig && <Space.Compact style={{ width: '100%' }}>
                    <Input addonBefore={<KeyOutlined />}
                    placeholder="MiMo API Key (from platform.xiaomimimo.com)"
                    allowClear
                    style={{ width: '100%' }}
                    minLength={10}
                    onChange={(e) => setLocalKey(e.target.value)}
                    />
                    <Button type="default" onClick={() => {
                        checkApiKey(localKey);
                    }}>Update</Button>
                </Space.Compact>
            }
            {
              !isConfig && <Button type="default"
              style={{ width: '100%' }}
              onClick={() => {
                setIsConfig(true);
                }}><KeyOutlined /> Setup API</Button>
            }
         </Space>
    </>)

    };

export default ApiPanel;