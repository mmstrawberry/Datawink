import React, { useEffect, useState } from 'react';
import {
  BookOutlined,
  ExclamationCircleOutlined,
  RocketOutlined,
  ZoomInOutlined,
} from '@ant-design/icons';
import { App as AntdApp, Button, Layout, Menu, theme, ConfigProvider } from 'antd';
import { observer } from 'mobx-react';
import ToolView from './views/ToolView';
import AboutView from './views/AboutView';
import store from './store';
import InternalView from './views/InternalView';
import Loading from './components/Loading';
import { CANVAS_ID } from './assets/constant/variables';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: '1',
    icon: <RocketOutlined />,
    label: 'Tool',
  },
  // {
  //   key: '2',
  //   icon: <BookOutlined />,
  //   label: 'History',
  // },
  // {
  //   key: '3',
  //   icon: <ExclamationCircleOutlined />,
  //   label: 'About',
  // },
  // {
  //   key: '4',
  //   icon: <ZoomInOutlined />,
  //   label: 'Inspect',
  // }
]

const AppContent: React.FC = observer(() => {
  const [collapsed, setCollapsed] = useState(true);
  const [activeView, setActiveView] = useState<React.ReactNode>('1');
  const { message } = AntdApp.useApp();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    if (store.ui.notifyMessage.length === 0) return 
    const type = store.ui.notifyType
    if (type === "error") {
      message.error(store.ui.notifyMessage);
    } else if (type === "success") {
      message.success(store.ui.notifyMessage);
    } else if (type === "warning") {
      message.warning(store.ui.notifyMessage); 
    } else {
      message.info(store.ui.notifyMessage);
    }
  }, [store.ui.notifyFlag]);

  const mainStyle: React.CSSProperties = {
    margin: 0,
    padding: '0 0 8px 0',
    minHeight: 280,
    height: '100vh',
    background: colorBgContainer,
    borderRadius: borderRadiusLG,
  }

  return (
    <Layout>
      <Sider collapsible collapsed={collapsed} theme="light" onCollapse={(value) => setCollapsed(value)}>
        <div className="demo-logo-vertical" />
        <h3 style={{
          color: '#333',
          fontSize: '20px',
          textAlign: 'center',
          fontWeight: 'bold',
          margin: '16px 16px',
        }}>
          {collapsed ? <img src='./logo.png' alt="logo" width={20} onClick={()=>{
            // disable the hidden logging facility
            return;
            const llmLogs = JSON.stringify(store.llmLogs)
            const logs = JSON.stringify(store.logs)
            const svg = document.getElementById(CANVAS_ID)?.innerHTML || ""
            const code = store.data.code
            const params = JSON.stringify(store.data.params)
            const conversation = JSON.stringify(store.Messages)
            const time = new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/[/:\s]/g, match => match === '/' ? '-' : '').replace(',', '-')
            const logStr = `
${logs}

${llmLogs}

${svg}

${code}

${params}

${conversation}

${time}
`
           const blob = new Blob([logStr], { type: 'text/plain' });
           const url = URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.href = url;
           a.download = `log-${time}.txt`;
           a.click();
           URL.revokeObjectURL(url);
           message.success('Log file downloaded successfully');
           a.remove()
          }}/> : <><img src='src/assets/logo.png' alt="logo" width={20} /> DataWink</>}
        </h3>
        <Menu
          style={{
            backgroundColor: '#fefefe',
          }}
          mode="inline"
          defaultSelectedKeys={['1']}
          onClick={(e) => {
            setActiveView(e.key);
          }}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Content
          style={mainStyle}
        >
            { activeView === '1' && <ToolView /> }
            { activeView === '3' && <AboutView /> }
            { activeView === '4' && <InternalView /> }
            <Loading />
        </Content>
      </Layout>
    </Layout>
  );
});


const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#9a14e2',

        },
        components: {
          Menu: {
            itemBg: '#f9f9f9',
          },
          Tree: {
            titleHeight: 10,
            indentSize: 12,
            fontSize: 10,
            fontFamily: 'Roboto Mono',
          }
        }
      }}
    >
      <AntdApp>
        <AppContent />
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
