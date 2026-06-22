// MiMo V2.5 配置 - Anthropic Messages API 格式
const model = "mimo-v2.5"
const baseURL = import.meta.env.DEV
    ? `${window.location.origin}/api/mimo`
    : "https://token-plan-cn.xiaomimimo.com/anthropic"

// Anthropic 消息格式类型
export interface AnthropicMessageParam {
    role: "user" | "assistant";
    content: string | AnthropicContentBlock[];
}

export type AnthropicContentBlock =
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: "image/png"; data: string } };

// 用于返回的兼容格式
export interface ChatResult {
    choices: Array<{
        message: {
            content: string | null;
        };
    }>;
    usage?: {
        total_tokens: number;
        prompt_tokens: number;
        completion_tokens: number;
        prompt_tokens_details?: {
            cached_tokens: number;
        };
    };
}

// 直接用 fetch 调用 Anthropic Messages API
const getChatCompletion = async (
    messages: AnthropicMessageParam[],
    key: string,
    _responseFormat?: unknown,
    temperature: number = 0.5,
): Promise<ChatResult> => {
    // 提取 system 消息
    let systemText = "";
    const userMessages: Array<{ role: "user" | "assistant"; content: string | AnthropicContentBlock[] }> = [];

    for (const msg of messages) {
        if ((msg as any).role === "system") {
            systemText = typeof msg.content === "string"
                ? msg.content
                : msg.content.filter((b): b is { type: "text"; text: string } => b.type === "text").map(b => b.text).join("\n");
        } else if (msg.role === "user" || msg.role === "assistant") {
            userMessages.push({ role: msg.role, content: msg.content });
        }
    }

    console.log("send request to MiMo (Anthropic API via fetch)");

    const url = `${baseURL}/v1/messages`;
    const body: any = {
        model,
        max_tokens: 8192,
        messages: userMessages,
        temperature,
    };
    if (systemText) {
        body.system = systemText;
    }

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();

    // 提取文本内容
    const textContent = (data.content || [])
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("");

    // 转换为兼容格式
    const result: ChatResult = {
        choices: [{ message: { content: textContent } }],
        usage: data.usage ? {
            total_tokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
            prompt_tokens: data.usage.input_tokens || 0,
            completion_tokens: data.usage.output_tokens || 0,
            prompt_tokens_details: { cached_tokens: 0 },
        } : undefined,
    };

    return result;
};

export default getChatCompletion;
