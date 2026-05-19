import { observer } from "mobx-react";
import store from "../store";
import { ChatboxMsg } from "../assets/constant/types";
import { Avatar, Button, Divider, Flex, Input, List, Modal, Skeleton } from "antd";
import { BookOutlined, DeleteOutlined, ExclamationOutlined, LoadingOutlined, ReloadOutlined, RobotOutlined, SendOutlined, UserOutlined } from "@ant-design/icons";
import { useState } from "react";
import { synthesizeWidget } from "../assets/llm/pipeline";
import { CANVAS_ID } from "../assets/constant/variables";
import Markdown from 'react-markdown'
import WidgetCard from "./WidgetCard";

interface MessageProps {
    idx: number,
    message: ChatboxMsg
}

const _devMessages: ChatboxMsg[] = [
    {
        role: 'user',
        content: 'Hello, how are you?'
    },
    {
        role: 'assistant',
        content: 'I am fine, thank you!'
    },
    {
        role: 'user',
        content: 'What is the weather in Tokyo?'
    },
    {
        role: 'assistant',
        content: 'The weather in Tokyo is sunny today.'
    }
]


const Message: React.FC<MessageProps> = ({ idx, message }) => {
    const isUser = message.role === "user"


    return <Flex style={{
        maxWidth: '100%',
        paddingLeft: '6px',
        paddingRight: '6px',
        paddingTop: '4px',
        paddingBottom: '4px',
        backgroundColor: isUser ? 'rgb(250 250 250)' : '#fff',
    }}>
        <div style={{
            marginRight: '12px'
        }}>
            <Avatar
                icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                size={24}
                style={{
                    backgroundColor: isUser ? 'rgb(181 225 238)' : 'rgb(219 193 232)'
                }}
            />
        </div>
        <div className="chat-message">

            <Markdown >
                {message.content}
            </Markdown>

            { message.newWidgets && message.newWidgets.length > 0 && <div className="inchat"> 
                {
                    message.newWidgets.map((widget, idx) => <WidgetCard param={widget} key={idx.toString()} />)
                }
                </div>
            }

            {
                idx === store.Messages.length - 1 && (store.ui.isQuerying) && 

                <Skeleton active paragraph={{ rows: 2 }} title={null} />
            }
        </div>
    </Flex>

}

export const Chatbox = observer(() => {
    const [userQuery, setUserQuery] = useState('')
    const [inputVersionName, setInputVersionName] = useState('')
    const [inputVersionDescription, setInputVersionDescription] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false)

    const getResponse = (query: string) => {
        store.addLog({
            action: `Query: ${query}`,
            type: 'LLM Query'
        })
        store.ui.setIsQuerying(true)
        store.ui.setActiveCanvasTab('canvas')
        const svgString = document.getElementById(CANVAS_ID)?.outerHTML || ""
        console.log('svgString', svgString.length)
        store.addUserMsg({
            role: 'user',
            content: query
        })
        store.addUserMsg({
            role: 'assistant',
            content: 'Thinking...'
        })
        synthesizeWidget(query, svgString, false).then(() => {
            store.ui.setIsQuerying(false)
            store.requestExec(false)
          
        }).catch((err) => {
            store.updateLastLLMMsg(`${err}`)
            store.ui.notify(err, 'error')
            store.ui.setIsQuerying(false)
        })
        
    }

    const bookmarkVersion = () => {
        setIsModalOpen(true)
    }

    const applyVersion = (id: string) => {
        store.resetToVersion(id)
        setIsVersionHistoryOpen(false)
    }

    return <><div style={
        {height: 'calc(100%)',
            position: 'relative',
            overflowY: 'auto',
            overflowX: 'hidden'}
    }>

       
        <div className="button-panel" style={{
            paddingTop: '12px',
            paddingBottom: '12px',
            paddingLeft: '12px',
            paddingRight: '12px',
            textAlign: 'center',
            display: 'fixed',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            top: '0',
            left: '0',
            right: '0',
            zIndex: '1000'
        }}>
            <Flex justify="space-evenly" style={{ flexWrap: 'wrap' }}
                align="start"
                gap={'small'}>
                    <Button onClick={() => {
                        store.data.setChatHistory([])
                    }}>
                        <DeleteOutlined />
                    </Button>
                <Button onClick={bookmarkVersion}>
                    <BookOutlined />
                    Bookmark
                </Button>
                <Button onClick={() => setIsVersionHistoryOpen(true)}>Version History</Button>
            </Flex>
        </div>
        <div className="message-panel" style={{
            marginLeft: '3px',
            marginRight: '3px',
            maxHeight: '90vh',
            overflowY: 'auto',
            overflowX: 'hidden'
        }}>
            {store.Messages.filter(m => m.role !== 'log').map((message, mIdx) =>
                <Message
                    key={mIdx}
                    idx={mIdx}
                    message={message}
                />)}

            {store.Messages[store.Messages.length - 1]?.role === 'assistant' && <div style={{

            }}
            >
                <Divider style={{
                    marginTop: '0px',
                    marginBottom: '0px',
                }}>
                    <Button
                        icon={store.ui.isQuerying ? <ExclamationOutlined /> : <ReloadOutlined />}
                        size="small"
                        type="text"
                        disabled={true}
                        className="regenerate-button"
                        onClick={() => {
                            if (store.ui.isQuerying) {
                                // abandon task
                                store.ui.setIsQuerying(false)
                            }
                        }}
                    >
                        {store.ui.isQuerying ? 'Stop' : 'Re-generate'}
                    </Button>
                </Divider>

            </div>}
        </div>
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px',
            backgroundColor: '#fff',
            textAlign: 'center'
        }}>
            <div style={{
                width: '75%',
                margin: '0 auto'
            }}>
                <div>
                    <Input.TextArea
                        placeholder="Type your message here..."
                        autoSize={{ minRows: 2, maxRows: 6 }}
                        style={{
                            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'
                        }}
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        // onPressEnter={(e) => {
                        //     e.preventDefault()
                        //     if (store.ui.isQuerying) {
                        //         store.ui.notify('Please wait for the previous query to complete', 'error')
                        //         return
                        //     }
                        //     if (!userQuery.trim()) return
                        //     getResponse(userQuery)
                        //     setUserQuery('')
                        // }}
                    />
                    <Button
                        type="default"
                        style={{
                            position: 'absolute',
                            right: '6%',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            padding: '0 8px'
                        }}

                        onClick={() => {
                            if (store.ui.isQuerying) {
                                store.ui.notify('Please wait for the previous query to complete', 'error')
                                return
                            }
                            if (!userQuery.trim()) return;
                            getResponse(userQuery)
                            setUserQuery('');
                        }}
                    >
                        {store.ui.isQuerying ? <LoadingOutlined style={{ transform: 'rotate(-45deg)', translate: '1px -1.5px' }} /> : <SendOutlined style={{ transform: 'rotate(-45deg)', translate: '1px -1.5px' }} />}
                    </Button>
                </div>

            </div>
        </div>
        <Modal
            title="Version History"
            open={isVersionHistoryOpen}
            onCancel={() => setIsVersionHistoryOpen(false)}
            footer={null}
            width={520}
            destroyOnClose
        >
            <List
                size="small"
                bordered={false}
                style={{ maxHeight: 'min(60vh, 440px)', overflowY: 'auto' }}
                dataSource={[...store.data.versions].reverse()}
                locale={{ emptyText: 'No saved versions yet. Use Bookmark to save one.' }}
                renderItem={(v) => {
                    const desc = v.description?.trim() ?? ''
                    return (
                        <List.Item
                            style={{ cursor: 'pointer', padding: '6px 4px', display: 'block' }}
                            onClick={() => applyVersion(v.id)}
                        >
                            <Flex justify="space-between" align="baseline" gap={10} style={{ width: '100%' }}>
                                <span
                                    style={{
                                        fontWeight: 600,
                                        fontSize: 13,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        minWidth: 0,
                                    }}
                                >
                                    {v.alias}
                                </span>
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: 'rgba(0, 0, 0, 0.45)',
                                        flexShrink: 0,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {v.savedAt ?? ''}
                                </span>
                            </Flex>
                            {desc ? (
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: 'rgba(0, 0, 0, 0.55)',
                                        lineHeight: 1.3,
                                        marginTop: 2,
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {desc}
                                </div>
                            ) : null}
                        </List.Item>
                    )
                }}
            />
        </Modal>

        <Modal
            title="Save the Current Version"
            open={isModalOpen}
            onCancel={() => {
                setIsModalOpen(false)
            }}
            onOk={() => {
                if (inputVersionName.length === 0) {
                    store.ui.notify('Please enter a version name', 'error')
                    return
                }
                store.addVersion(inputVersionName, inputVersionDescription)
                setInputVersionName('')
                setInputVersionDescription('')
                store.ui.notify('Saved a new version', 'success')
                setIsModalOpen(false)
            }}>
            <Input
                placeholder="Enter version name"
                value={inputVersionName}
                onChange={(e) => {
                    setInputVersionName(e.target.value)
                }}
            />
            <Input.TextArea
                placeholder="Enter version description"
                value={inputVersionDescription}
                style={{
                    marginTop: '12px'
                }}
                onChange={(e) => {
                    setInputVersionDescription(e.target.value)
                }}
            />


        </Modal>

    </div>


</>
})