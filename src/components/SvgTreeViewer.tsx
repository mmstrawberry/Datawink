import React, { useEffect, useMemo } from 'react';
import { Tooltip, Tree, TreeProps } from 'antd';
import { DataNode } from 'antd/es/tree';
import { observer } from 'mobx-react-lite';
import store from '../store';

const SvgTreeViewer: React.FC = observer(() => {
  const treeData = useMemo(() => {
    if (!store.data.layeredSvgString) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(store.data.layeredSvgString, 'image/svg+xml');
    const svgElement = doc.documentElement;

    const convertToTreeNode = (element: Element): DataNode => {
      const children = Array.from(element.children).map(child => 
        convertToTreeNode(child)
      );
    
    const getOpeningTag = (el: Element) => {
      const innerText = el.textContent || '';
      const decoratedInnerText = innerText.length > 0 ? '\n"' + innerText + '"' : '';
      const attributes = Array.from(el.attributes)
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');
      return `<${el.tagName}${attributes ? ' ' + attributes : ''}>`  + decoratedInnerText ;
    };

      return {
        key: Math.random().toString(36),
        title: <Tooltip 
            placement="topRight"
            title={<div className="tree-tag">{getOpeningTag(element)}</div>}
          >
          <span className="tree-tagname">
              {element.tagName}
            </span>
            {/* {element.getAttribute('id') && (
              <span className="tree-id">
                &nbsp;
                {'#' + element.getAttribute('id')}
              </span>
            )}
            {element.getAttribute('class') && (
              <span className="tree-class">
                &nbsp;
                {'.' + element.getAttribute('class')?.split(' ').join('.')}
              </span>
            )} */}
            {
              element.getAttribute('data-vis-layer') && (
                <span className="tree-vis-layer">
                  &nbsp;
                  {element.getAttribute('data-vis-layer')}
                </span>
              )
            }
            {
              element.getAttribute('data-slot') && (
                <span className="tree-vis-slot">
                  &nbsp;
                  {element.getAttribute('data-slot')}
                </span>
              )
            }
            {
              element.tagName === 'text' && (
                <span className="tree-text">
                  &nbsp;
                  {"\"" + element.textContent + "\""}
                </span>
              )
            }
          </Tooltip>,
        children: children.length > 0 ? children : undefined,
        element: element as Element,
      } as DataNode & { element: Element };
    };

    return [convertToTreeNode(svgElement)];
  }, [store.data.layeredSvgString, store.devFlag]);

  useEffect(() => {
    // console.log('treeData', treeData, store.data.layeredSvgString, store.devFlag);
  }, [store.devFlag]);

  interface ExtendedDataNode extends DataNode {
    element: Element;
  }

  const onDrop: TreeProps['onDrop'] = (info) => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const loop = (
      data: ExtendedDataNode[],
      key: React.Key,
      callback: (node: ExtendedDataNode, i: number, data: ExtendedDataNode[]) => void,
    ) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
          return callback(data[i], i, data);
        }
        if (data[i].children) {
          loop(data[i].children as ExtendedDataNode[], key, callback);
        }
      }
    };

    const data = [...treeData] as ExtendedDataNode[];
    let dragObj: ExtendedDataNode | null = null;

    // Find and remove dragged node
    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    if (!dragObj) return; // Early return if dragObj wasn't found

    if (!info.dropToGap) {
      // Drop on the content
      loop(data, dropKey, (item) => {
        item.children = item.children || [];
        if (dragObj !== null) {
        item.children.unshift(dragObj);
        // Update the actual SVG DOM
          (item.element as Element).prepend(dragObj.element as Element);
        }
      });
    } else {
      let ar: ExtendedDataNode[] = [];
      let i: number;
      loop(data, dropKey, (_item, index, arr) => {
        ar = arr;
        i = index;
      });
      if (dropPosition === -1) {
        ar.splice(i!, 0, dragObj);
        // Update the actual SVG DOM
        (ar[i!].element as Element).parentElement?.insertBefore(
          dragObj.element as Element,
          ar[i!].element as Element
        );
      } else {
        ar.splice(i! + 1, 0, dragObj);
        // Update the actual SVG DOM
        (ar[i!].element as Element).parentElement?.insertBefore(
          dragObj.element as Element,
          (ar[i!].element as Element).nextSibling
        );
      }
    }

    // TODO: Update the store with the modified SVG
    const serializer = new XMLSerializer();
    // const updatedSvgString = serializer.serializeToString(treeData[0].element as Element);
  };

  return (
    <Tree
      defaultExpandAll={true}
      autoExpandParent={true}
      treeData={treeData}
      showLine
      draggable
      blockNode
      onDrop={onDrop}
    />
  );
});

export default SvgTreeViewer;