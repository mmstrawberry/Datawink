import React, { useEffect, useState, useRef, useCallback } from 'react';
import { observer } from 'mobx-react';
import { Tabs } from 'antd';
import store from '../store';
import * as d3 from 'd3';
import { CANVAS_ID, CANVAS_CONTAINER_ID, DISPLAY_SVG_ID_PREFIX, RENDER_CANVAS_ID, PLOT_CANVAS_ID } from '../assets/constant/variables';
import { getStandardSvgStr } from '../assets/svg/svg-processing';

interface CanvasProps {
  svgString?: string;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
}

const processSvg = (svgString: string, width: number, height: number) => {
  let svg = svgString
  const hasPrefix = svgString.includes(DISPLAY_SVG_ID_PREFIX)
  if (!hasPrefix) {
    // add a prefix to the displayed svg string to avoid id conflicts
    svg = svg.replaceAll("id=\"", "id=\"" + DISPLAY_SVG_ID_PREFIX)
    // Handle url(#id) patterns - both with and without quotes, in attributes and styles
    // Pattern 1: url(#id) without quotes
    svg = svg.replace(/url\(#([a-zA-Z_][a-zA-Z0-9_-]*)\)/g, `url(#${DISPLAY_SVG_ID_PREFIX}$1)`)
    // Pattern 2: url("#id") with double quotes
    svg = svg.replace(/url\("#([a-zA-Z_][a-zA-Z0-9_-]*)"\)/g, `url("#${DISPLAY_SVG_ID_PREFIX}$1")`)
    // Pattern 3: url('#id') with single quotes
    svg = svg.replace(/url\('#([a-zA-Z_][a-zA-Z0-9_-]*)'\)/g, `url('#${DISPLAY_SVG_ID_PREFIX}$1')`)
    // Pattern 4: url(&quot;#id&quot;) with HTML entity quotes
    svg = svg.replace(/url\(&quot;#([a-zA-Z_][a-zA-Z0-9_-]*)&quot;\)/g, `url(&quot;#${DISPLAY_SVG_ID_PREFIX}$1&quot;)`)
    
    // inside the <style> tag, replace all patterns of #  with a new id with the prefix
    // Use non-greedy match with [\s\S] to handle multiline content properly
    svg = svg.replace(/<style[^>]*>([\s\S]*?)<\/style>/g, (match, content) => {
      // Replace # followed by an identifier (CSS selector pattern), but skip if already has prefix
      const prefixEscaped = DISPLAY_SVG_ID_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return match.replace(new RegExp(`#(?!${prefixEscaped})([a-zA-Z_][a-zA-Z0-9_-]*)`, 'g'), `#${DISPLAY_SVG_ID_PREFIX}$1`);
    });
  }
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(svg, "image/svg+xml");
  const svgElement = xmlDoc.documentElement;
  const attributes = svgElement.attributes;

  const _w = attributes.getNamedItem('width')?.value;
  const _h = attributes.getNamedItem('height')?.value;
  let w = width;
  let h = height;
  if (typeof _w === 'undefined' || _w.includes('%') || _w.includes('px')) {
    w =  width;
  } else {
    w = parseFloat(_w);
  }

  if (typeof _h === 'undefined' || _h.includes('%') || _h.includes('px')) {
    h = height;
  } else {
    h = parseFloat(_h);
  }

  // if the viewbox attribute is not present, add it
  if (!attributes.getNamedItem('viewBox')) {
    svg = svg.replace(/<svg[^>]*>/, (match) => {
      return match.replace('>', ` viewBox="0 0 ${w} ${h}">`);
    });
  }
  // strip the <datagroup> wrappers
  svg = getStandardSvgStr(svg);
  return svg
}

const getSvgDimensions = (svgElement: SVGSVGElement | null): { width: number; height: number } => {
  if (!svgElement) return { width: 400, height: 400 };
  
  const viewBox = svgElement.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.split(/\s+|,/).filter(p => p.length > 0);
    if (parts.length >= 4) {
      const w = parseFloat(parts[2]);
      const h = parseFloat(parts[3]);
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
        return { width: w, height: h };
      }
    }
  }
  
  const width = parseFloat(svgElement.getAttribute('width') || '400');
  const height = parseFloat(svgElement.getAttribute('height') || '400');
  return { 
    width: isNaN(width) || width <= 0 ? 400 : width, 
    height: isNaN(height) || height <= 0 ? 400 : height 
  };
};

const ZoomableSvgWrapper: React.FC<{
  containerId: string;
  svgId?: string;
  svgString?: string;
  externalWidth?: number;
  externalHeight?: number;
}> = ({ containerId, svgId, svgString, externalWidth, externalHeight }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomableRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<HTMLDivElement, unknown> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const initZoomRef = useRef<((forceReset?: boolean) => void) | null>(null);
  const isInitializedRef = useRef(false);
  const userHasZoomedRef = useRef(false);
  const lastContainerSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    if (externalWidth !== undefined && externalHeight !== undefined && 
        externalWidth > 0 && externalHeight > 0 &&
        initZoomRef.current && isInitializedRef.current) {
      requestAnimationFrame(() => {
        initZoomRef.current?.(false);
      });
    }
  }, [externalWidth, externalHeight]);

  // Initialize zoom for Source tab (static SVG string)
  useEffect(() => {
    if (!containerRef.current || !zoomableRef.current || !svgString) return;
    const container = containerRef.current;
    const zoomable = zoomableRef.current;
    const zoom = d3.zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        const { transform } = event;
        zoomable.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;
        userHasZoomedRef.current = true;
      });
    
    zoomBehaviorRef.current = zoom;
    d3.select(container).call(zoom);
    const initZoom = (forceReset = false) => {
      const containerRect = container.getBoundingClientRect();
      if (containerRect.width === 0 || containerRect.height === 0) return;
      const svgElement = zoomable.querySelector('svg') as SVGSVGElement;
      if (!svgElement) return;

      // Get natural size by temporarily resetting transform, then restore
      const currentTransform = zoomable.style.transform;
      zoomable.style.transform = 'none';
      const svgRect = svgElement.getBoundingClientRect();
      zoomable.style.transform = currentTransform;
      
      const actualWidth = svgRect.width > 0 ? svgRect.width : 400;
      const actualHeight = svgRect.height > 0 ? svgRect.height : 400;
      
      // Ensure we have valid dimensions
      if (actualWidth <= 0 || actualHeight <= 0) return;
      
      const scale = Math.min(
        containerRect.width / actualWidth,
        containerRect.height / actualHeight
      );
      const sizeChanged = Math.abs(containerRect.width - lastContainerSizeRef.current.width) > 1 || 
                         Math.abs(containerRect.height - lastContainerSizeRef.current.height) > 1;
      
      if (forceReset || sizeChanged) {
        let newScale = scale;
        // Calculate center position: translate so that SVG center aligns with container center
        // With transform-origin '0 0', we need to translate by: container_center - scaled_svg_center_offset
        const scaledWidth = actualWidth * scale;
        const scaledHeight = actualHeight * scale;
        let newX = (containerRect.width - scaledWidth) / 2;
        let newY = (containerRect.height - scaledHeight) / 2;
        
        if (!forceReset && userHasZoomedRef.current && zoomBehaviorRef.current) {
          const currentZoomTransform = d3.zoomTransform(container);
          if (currentZoomTransform && currentZoomTransform.k > 0) {
            newScale = Math.max(0.1, Math.min(10, currentZoomTransform.k));
            const scaledWidth2 = actualWidth * newScale;
            const scaledHeight2 = actualHeight * newScale;
            newX = (containerRect.width - scaledWidth2) / 2;
            newY = (containerRect.height - scaledHeight2) / 2;
          }
        }
        
        const newTransform = d3.zoomIdentity
          .translate(newX, newY)
          .scale(newScale);

        d3.select(container).call(zoom.transform, newTransform);
        lastContainerSizeRef.current = { width: containerRect.width, height: containerRect.height };
      }
    };

    initZoomRef.current = initZoom;

    const timeoutId = setTimeout(() => {
      initZoom(true); // Force reset on initial load
      isInitializedRef.current = true;
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      if (isInitializedRef.current) {
        requestAnimationFrame(() => {
          initZoom(false);
        });
      }
    });
    resizeObserver.observe(container);
    resizeObserverRef.current = resizeObserver;

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      d3.select(container).on('.zoom', null);
      zoomBehaviorRef.current = null;
    };
  }, [svgString]);

  useEffect(() => {
    if (!containerRef.current || !zoomableRef.current || !svgId) return;

    const container = containerRef.current;
    const zoomable = zoomableRef.current;
    const zoom = d3.zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        const { transform } = event;
        zoomable.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;
        userHasZoomedRef.current = true;
      });
    
    zoomBehaviorRef.current = zoom;
    d3.select(container).call(zoom);
    
    const initZoom = (forceReset = false) => {
      const svgElement = document.getElementById(svgId) as unknown as SVGSVGElement;
      if (!svgElement) return;
      const containerRect = container.getBoundingClientRect();
      if (containerRect.width === 0 || containerRect.height === 0) return;
      
      // Get natural size by temporarily resetting transform, then restore
      const zoomable = zoomableRef.current;
      if (!zoomable) return;
      const currentTransform = zoomable.style.transform;
      zoomable.style.transform = 'none';
      const svgRect = svgElement.getBoundingClientRect();
      zoomable.style.transform = currentTransform;
      
      const actualWidth = svgRect.width > 0 ? svgRect.width : 400;
      const actualHeight = svgRect.height > 0 ? svgRect.height : 400;
      
      // Ensure we have valid dimensions
      if (actualWidth <= 0 || actualHeight <= 0) return;

      const scale = Math.min(
        containerRect.width / actualWidth,
        containerRect.height / actualHeight
      );

        const sizeChanged = Math.abs(containerRect.width - lastContainerSizeRef.current.width) > 1 || 
                           Math.abs(containerRect.height - lastContainerSizeRef.current.height) > 1;
      
      if (forceReset || sizeChanged) {
        let newScale = scale;
        // Calculate center position: translate so that SVG center aligns with container center
        // With transform-origin '0 0', we need to translate by: container_center - scaled_svg_center_offset
        const scaledWidth = actualWidth * scale;
        const scaledHeight = actualHeight * scale;
        let newX = (containerRect.width - scaledWidth) / 2;
        let newY = (containerRect.height - scaledHeight) / 2;
        
        if (!forceReset && userHasZoomedRef.current && zoomBehaviorRef.current) {
          const currentZoomTransform = d3.zoomTransform(container);
          if (currentZoomTransform && currentZoomTransform.k > 0) {
            newScale = Math.max(0.1, Math.min(10, currentZoomTransform.k));
            const scaledWidth2 = actualWidth * newScale;
            const scaledHeight2 = actualHeight * newScale;
            newX = (containerRect.width - scaledWidth2) / 2;
            newY = (containerRect.height - scaledHeight2) / 2;
          }
        }
        
        const newTransform = d3.zoomIdentity
          .translate(newX, newY)
          .scale(newScale);

        d3.select(container).call(zoom.transform, newTransform);
        lastContainerSizeRef.current = { width: containerRect.width, height: containerRect.height };
      }
    };

    initZoomRef.current = initZoom;

    const checkAndInit = () => {
      const svgElement = document.getElementById(svgId);
      if (svgElement) {
        setTimeout(() => {
          initZoom(true);
          isInitializedRef.current = true;
        }, 100);
      } else {
        setTimeout(checkAndInit, 50);
      }
    };

    checkAndInit();

    // Observe SVG changes
    const svgElement = document.getElementById(svgId);
    if (svgElement) {
      const mutationObserver = new MutationObserver(() => {
        setTimeout(() => {
          if (isInitializedRef.current) {
            initZoom(false);
          }
        }, 200);
      });

      mutationObserver.observe(svgElement, {
        childList: true,
        attributes: true,
        attributeFilter: ['viewBox', 'width', 'height'],
        subtree: false
      });

      mutationObserverRef.current = mutationObserver;
    }

    const resizeObserver = new ResizeObserver(() => {
      if (isInitializedRef.current) {
        requestAnimationFrame(() => {
          initZoom(false);
        });
      }
    });

    resizeObserver.observe(container);
    resizeObserverRef.current = resizeObserver;

    return () => {
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
      }
      resizeObserver.disconnect();
      d3.select(container).on('.zoom', null);
      zoomBehaviorRef.current = null;
    };
  }, [svgId, store.ui.activeCanvasTab]);

  return (
    <div
      ref={containerRef}
      id={containerId}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'grab',
      }}
      onMouseDown={(e) => {
        if (e.button === 0) {
          e.currentTarget.style.cursor = 'grabbing';
        }
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.cursor = 'grab';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.cursor = 'grab';
      }}
    >
      <div
        ref={zoomableRef}
        style={{
          transformOrigin: '0 0',
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {svgString ? (
          <div dangerouslySetInnerHTML={{ __html: svgString }} />
        ) : svgId ? (
          // For Canvas tab, render SVG directly here
          <svg id={svgId} viewBox="0 0 700 700"></svg>
        ) : null}
      </div>
    </div>
  );
};

const SvgCanvas: React.FC<CanvasProps> = observer(({
  svgString = '',
  width = 400,
  height = 400,
  containerWidth,
  containerHeight
}) => {
  const [renderSvgStr, setRenderSvgStr] = useState<string>(getStandardSvgStr(svgString));
  const [layeredSvgStr, setLayeredSvgStr] = useState<string>(getStandardSvgStr(store.data.layeredSvgString));
  const [cleanSvgStr, setCleanSvgStr] = useState<string>(getStandardSvgStr(store.data.cleanSvgString));
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const svg = processSvg(svgString, width, height);
    setRenderSvgStr(svg);
  }, [svgString, height, width]);

  useEffect(() => {
    d3.select('#' + CANVAS_ID).html('')
    store.ui.setActiveCanvasTab('source')
  }, [store.cleanupFlag]);

  const getSvgComponent = (svgString: string) => {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >

        <ZoomableSvgWrapper 
          containerId="source-svg-container"
          svgString={processSvg(svgString, width, height)}
          externalWidth={containerWidth}
          externalHeight={containerHeight}
        />
      </div>
    );
  };

  return (<>
    <Tabs
      defaultActiveKey="source"
      style={{
        backgroundColor: 'white',
        height: '100%'
      }}
      activeKey={store.ui.activeCanvasTab}
      onChange={(key) => {
        if (key === 'canvas') {
          if (store.data.code.length > 0 && store.data.tableData.length > 0) {
            store.requestExec(false)
          }
        }
        store.ui.setActiveCanvasTab(key)
      }}
      size="small"
      items={[
        {
          label: 'Source',
          key: 'source',
          children: getSvgComponent(renderSvgStr)
        },
        {
          label: 'Canvas',
          key: 'canvas',
          children: <>
            <div style={{
              width: '100%',
              height: containerHeight ? containerHeight : '100%',
              position: 'relative',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <ZoomableSvgWrapper 
                containerId={CANVAS_CONTAINER_ID}
                svgId={CANVAS_ID}
                externalWidth={containerWidth}
                externalHeight={containerHeight}
              />
            </div>
          </>
        },
      ]}
    />

    <div style={{
      overflow: 'hidden',
      display: 'none',
      position: 'relative',
      height: '30vh',
      width: '100%',
    }}>
      <canvas id={PLOT_CANVAS_ID} style={{
        position: 'absolute',
        top: '0',
        left: '0',
      }} />
    </div>
  </>
  );
});

export default SvgCanvas;
