import React, { useState } from 'react';
import { BarChartOutlined, BulbOutlined, DotChartOutlined, FileImageOutlined, LineChartOutlined, LinkOutlined, LoadingOutlined, PieChartOutlined, PlusOutlined, RadarChartOutlined, UploadOutlined } from '@ant-design/icons';
import { App as AntdApp, Upload, Button, Modal, Divider, Card, Tooltip, Image } from 'antd';
import type { GetProp, UploadProps } from 'antd';
import { BACKEND_URL_UPLOAD_DATA, FALLBACK_IMAGE_STR } from '../assets/constant/variables';
import store from '../store';
import { EXAMPLES } from '../assets/constant/examples';
import { RcFile } from 'antd/es/upload';
import { runReverseEngineering } from '../assets/llm/pipeline';


declare global {
  interface Window {
    Image: {
      new (): HTMLImageElement;
    };
  }
}

const { Meta } = Card;

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const fileUploadProps: UploadProps = {
  action: BACKEND_URL_UPLOAD_DATA,
  listType: 'picture',
  previewFile(file) {
    console.log('Your upload file:', file);
    // Your process logic. Here we just mock to the same file
    return fetch('https://next.json-generator.com/api/json/get/4ytyBoLK8', {
      method: 'POST',
      body: file,
    })
      .then((res) => res.json())
      .then(({ thumbnail }) => thumbnail);
  },
};

const getPrototypeIcon = (prototype: string | undefined) => {
  if (!prototype) return null
  switch (prototype) {
    case 'bar':
      return <BarChartOutlined />
    case 'pie':
      return <PieChartOutlined />
    case 'radar':
      return <RadarChartOutlined />
    case 'line':
      return <LineChartOutlined />
    case 'scatter':
      return <DotChartOutlined />
    default:
      return <BulbOutlined />
  }
}

const UploadPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { message } = AntdApp.useApp();

  const beforeUpload = (file: FileType) => {
    const isSvg = file.type === 'image/svg+xml';
    if (!isSvg) {
      message.error('You can only upload SVG file!');
    }
    const isLt50M = file.size / 1024 / 1024 < 50;
    if (!isLt50M) {
      message.error('Image must smaller than 50MB!');
    }
    return isSvg && isLt50M;
  };


  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOkModal = () => {
    setIsModalOpen(false);
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
  };

  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      // read the svg file
    }
  };

  const plotSvg = (svg: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      canvas.width = 400;
      canvas.height = 400;
  
      img.onload = function() {
        console.log(canvas, ctx)
        ctx?.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/png');
        resolve(base64);
      };
  
      img.onerror = function(error) {
        console.log('error', error)
        reject(error);
      };
  
      const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      img.src = src;
    });
  };

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  return (<>

    <Button type="primary" onClick={showModal}>
      <FileImageOutlined />

      {store.ui.hasUploadedRef ? 'Add Reference' : 'Update Reference'}
    </Button>
    <Modal title="SVG Reference" open={isModalOpen} onOk={handleOkModal} onCancel={handleCancelModal} footer={null} width={'75vw'}>
      <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', marginTop: '8px' }}>
        <Upload
          name="avatar"
          listType="picture-card"
          className="avatar-uploader"
          showUploadList={false}
          action={(f: RcFile)=>{
            console.log(f)
            // read the svg file and retrieve the svg string
            const reader = new FileReader();
            reader.onload = (e) => {
              const svg = e.target?.result as string;
              store.newSession();
              store.updateSvg(svg);
              setIsModalOpen(false);
              if (store.mode === 'dev') return
              store.ui.updateLoadingPercent(20, 'Loading...')
              runReverseEngineering(true).then(() => {
                store.ui.updateLoadingPercent(100, 'Done!')
              })
              plotSvg(svg).then(() => {
                // BUG: the image is not updated
              })
            }
            reader.readAsText(f)
            return new Promise(() => {})
          }}
          beforeUpload={beforeUpload}
          onChange={handleChange}
          style={{
            backgroundImage: imageUrl!=='error' ? `url(${imageUrl})` : 'none',
          }}
        >
           {uploadButton}
        
        </Upload>

        <Image src={imageUrl} 
          alt="selected image" 
          style={{ maxHeight: '102px', border: '1px dashed #d9d9d9', borderRadius: '8px' }} 
          fallback={FALLBACK_IMAGE_STR}
        />
      </div>
      <Divider orientation="center" plain>
        ✨ <span style={{ fontSize: '16px' }}>Jump start with examples!</span> ✨
      </Divider>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>

        { EXAMPLES.map((exp, eid) => {
          return <Card
            hoverable
            key={eid}
            style={{ width: "200px"}}
            onClick={() => {
              setImageUrl(`./gallery/${exp.preview}`)
              store.newSession();
  
              if (typeof exp.svg !== 'string') return;
                fetch('./gallery/' + exp.svg, {
                  headers: {
                    'type': 'image/svg+xml'
                  }}).then(res => res.text()).then(svg => {
                    store.updateSvg(svg)
                    if (exp.devProps) {
                      // user study
                      setIsModalOpen(false);
                      store.ui.updateLoadingPercent(20, 'Loading...')
                      setTimeout(() => {
                        store.updateDevProps(exp.devProps)
                        store.ui.updateLoadingPercent(100, 'Done!')
                        store.ui.setConfigMode('Template')
                        store.ui.setActiveCanvasTab('canvas')
                        setTimeout(( () => store.requestExec(false)), 100)
             
                      }, (store.mode !== 'dev') ? 5000 : 50)
                    } else {
                      // free-form mode
                      store.ui.updateLoadingPercent(20, 'Loading...')
                      runReverseEngineering(true).then(() => {
                        store.ui.updateLoadingPercent(100, 'Done!')
                        store.ui.setConfigMode('Template')
                        store.requestExec(false)
                      })
                      setIsModalOpen(false);
                    }
                  })
              }
            }
            cover={
              <img src={`./gallery/${exp.preview}`} alt={exp.title + ': ' + exp.description + `(by ${exp.author})`}
                style={{ width: "198px", height: "125px", objectFit: "cover", borderLeft: '1px solid #ededed', borderRight: '1px solid #ededed', borderTop: '1px solid #ededed', borderBottom: '1px solid #eaeaea' }}
              />
            }>
            <Meta title={<>
              {getPrototypeIcon(exp.prototype)} &nbsp;
              {exp.title} &nbsp;

            </>}
              description={
                <>by&nbsp;<i>{exp.author}</i> {exp.source && (
                  <Tooltip title="Source" placement="right">
                    <a href={exp.source} target="_blank" rel="noopener noreferrer">
                      <LinkOutlined />
                    </a>
                  </Tooltip>
                )}</>
              }
            />
          </Card>
        })}

      </div>

    </Modal>
    {/* <Flex gap="middle" wrap>
      <Upload {...fileUploadProps}>
        <Button icon={<UploadOutlined />}>Upload Data</Button>
      </Upload>


    </Flex> */}

  </>
  );
};

export default UploadPanel;