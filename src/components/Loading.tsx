import React from 'react';
import { Button, Modal, Progress, Spin } from 'antd';
import { useEffect } from 'react';
import { observer } from 'mobx-react';
import store from '../store';
import { LoadingOutlined } from '@ant-design/icons';
const Loading: React.FC = observer(() => {
  const [spinning, setSpinning] = React.useState(false);

  const showLoader = () => {
    setSpinning(true);

  };

  return (
    <>
      {/* {store.ui.loadingPercent !== 0 && <Modal>
        <Progress percent={store.ui.loadingPercent} size="small" />
        <Spin indicator={<LoadingOutlined spin />} percent={store.ui.loadingPercent} />
      </Modal>} */}

      {store.ui.loadingPercent !== 0 && <Spin indicator={<LoadingOutlined spin style={{zIndex: 9999, fontSize: '100px'}} />} fullscreen percent={store.ui.loadingPercent} />}
    </>
  );
});

export default Loading;