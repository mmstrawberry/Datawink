import { Button, Input, Space, notification } from "antd";
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

    const checkApiKey = async (apiKey: string) => {
        if (apiKey.length < 5) {
            openErrorNotification("API Key 长度不足，请检查。");
            return;
        }
        const baseURL = import.meta.env.DEV
            ? `${window.location.origin}/api/mimo`
            : "https://token-plan-cn.xiaomimimo.com/anthropic";

        try {
            const response = await fetch(`${baseURL}/v1/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                    model: "mimo-v2.5",
                    messages: [{ role: "user", content: "Hello" }],
                    max_tokens: 500,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                let msg = `HTTP ${response.status}`;
                try {
                    const errJson = JSON.parse(errorBody);
                    msg = errJson.error?.message || errJson.message || errorBody;
                } catch {
                    msg = errorBody || msg;
                }
                openErrorNotification(`API 验证失败: ${msg}`);
                return;
            }

            const data = await response.json();
            const text = (data.content || [])
                .filter((b: any) => b.type === "text")
                .map((b: any) => b.text)
                .join("");

            if (text) {
                openSuccessNotification("API Key 验证成功！");
                store.updateApiKey(apiKey);
                setIsConfig(false);
            } else {
                openErrorNotification("验证失败：返回内容为空");
            }
        } catch (error: any) {
            const msg = error?.message || String(error);
            console.error('MiMo API Error:', error);
            openErrorNotification(`API 验证失败: ${msg}`);
        }
    }

    return (<>
    {contextHolder}
         <Space direction="vertical" size="middle" style={{ width: '100%', flex: 1 }}>
            { isConfig && <Space.Compact style={{ width: '100%' }}>
                    <Input addonBefore={<KeyOutlined />}
                    placeholder="MiMo API Key (from platform.xiaomimimo.com)"
                    allowClear
                    style={{ width: '100%' }}
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
