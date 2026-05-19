import { Button, Space, Upload, Modal, Table, Divider } from "antd";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { CopyOutlined, EyeOutlined, PlusOutlined, TableOutlined, UndoOutlined } from "@ant-design/icons";
import * as d3 from 'd3';
import React from "react";
import { ReactGrid, Column, Id, Row, CellChange, DropdownCell, TextCell } from "@silevis/reactgrid";
import store from "../store";

const dividerStyle = {
    marginTop: '0',
    marginBottom: '4px',
    borderColor: 'rgb(170, 34, 243)',
    borderWidth: '4px !important',
    fontWeight: '550',
    color: 'rgb(170, 34, 243)',
    fontSize: '15px'
    
} as React.CSSProperties
// a helper function used to reorder arbitrary arrays
const reorderArray = <T extends object>(arr: T[], idxs: number[], to: number) => {
    const movedElements = arr.filter((_, idx) => idxs.includes(idx));
    const targetIdx = Math.min(...idxs) < to ? to += 1 : to -= idxs.filter(idx => idx < to).length;
    const leftSide = arr.filter((_, idx) => idx < targetIdx && !idxs.includes(idx));
    const rightSide = arr.filter((_, idx) => idx >= targetIdx && !idxs.includes(idx));
    return [...leftSide, ...movedElements, ...rightSide];
}

const handleCanReorderRows = (targetRowId: Id): boolean => {
    return targetRowId !== 'header' && targetRowId !== 'selection';
  }
  


const TableEditor: React.FC = observer(() => {

    // DEV ONLY <-- Leverage Mockup Data
    // when loading the dev data table, we need to update the UI table configurations
    useEffect(() => {
        if (store.devFlag) {
            if (!store.data.devProps)  return
                updateTable(store.data.devProps.data)
        }
    }, [store.devFlag])

    useEffect(() => {
        if (store.ui.flagTableUI > 0) {
            updateTable(store.data.tableData)
        }
    }, [store.ui.flagTableUI])

    const getColumns = (data: Array<Record<string, string | number>>): Column[] => {
        if (data.length === 0) return []
        return Object.keys(data[0]).map((col) => {
            return {
                columnId: col,
                width: 100,
                resizable: true,
            }
        })

    }
    
    const getRenderedTableData = (data: Array<Record<string, string | number>>) => {
        return data.map((item) => ({
            ...item,
        }));
    }
    const [helperCntr, setHelperCntr] = useState(0);
    const [tableDropdownValues, setTableDropdownValues] = useState(store.ui.tableDropdownValues);
    const [tableRows, setTableRows] = useState(store.ui.tableRows);  // ui table data
    const [tableColumns, setTableColumns] = useState(store.ui.tableColumns);
    const [flag, setFlag] = useState(0); // use for browser refresh

    const updateTable = (tabData: Array<Record<string, string | number>>) => {
        const columns = getColumns(tabData)
        const rows = getRows(tabData, store.data.fileData)
        store.ui.setTableColumns(columns)
        store.ui.setTableRows(rows)
        setTableRows(rows);
        setTableColumns(columns);
        store.data.setTableData(tabData)
        setFlag(flag + 1)
    }

    
    const getRows = (data: Array<Record<
        string, string | number>>, fileData: Array<Record<string, string | number>>=[]): Row[] => {
        if (data.length === 0) return []
        const headerRow = {
            rowId: "header",
            cells: Object.keys(data[0]).map((col) =>{
                return {
                    type: "text",
                    text: col,
                }
            })
        } as Row;
        const fileDataAttrs = fileData.length > 0 ? Object.keys(fileData[0]) : []
        const dropdownRow = {
            rowId: "dropdown",
            cells: Object.keys(data[0]).map((_, idx) => {
                return {
                    type: "dropdown",
                    isDisabled: false,
                    isOpen: false,
                    selectedValue: tableDropdownValues[idx],
                    values: [{
                        label: 'input',
                        value: 'input'
                    }, ...fileDataAttrs.map((attr) => {
                        return {
                            label: attr,
                            value: attr
                        }
                    })]
                }
            })
        } as Row;
        // const emptyRows = Array(2).fill(null).map((_, idx) => {
        //     return {
        //         rowId: 'empty-' + idx.toString(),
        //         reorderable: true,
        //         cells: Object.keys(data[0]).map((col) => { 
        //             return {
        //                 type: "text",
        //                 text: ''
        //             }
        //         })
        //     } as Row;
        // })
        return [headerRow, dropdownRow, ...data.map((d, idx) => {
            return {
                rowId: idx.toString(),
                reorderable: true,
                cells: Object.values(d).map((_value) => {
                    const value = _value ? _value.toString() : '';
                    return {
                        type: "text",
                        text: value
                    }
                })
            } as Row;
        })]
    }

    const handleColumnResize = (ci: Id, width: number) => {
        setTableColumns((prevColumns) => {
            const columnIndex = prevColumns.findIndex(el => el.columnId === ci);
            const resizedColumn = prevColumns[columnIndex];
            const updatedColumn = { ...resizedColumn, width };
            prevColumns[columnIndex] = updatedColumn;
            return [...prevColumns];
        });
    }

    // const handleColumnsReorder = (targetColumnId: Id, columnIds: Id[]) => {
    //     setTableColumns((prevColumns) => {
    //         const to = prevColumns.findIndex((column) => column.columnId === targetColumnId);
    //         const columnIdxs = columnIds.map((columnId) => prevColumns.findIndex((c) => c.columnId === columnId));
    //         const newColumns = reorderArray(prevColumns, columnIdxs, to)
    //         console.log(to, columnIdxs, newColumns, 'wtf')
    //         return newColumns
    //     })
    // }

    const handleRowsReorder = (targetRowId: Id, rowIds: Id[]) => {
        setTableRows((prev) => {
            const to = Number(targetRowId)
            const selectedRowIds = rowIds.map((idstr) => Number(idstr))
            const newTableData = reorderArray(prev, selectedRowIds, to) as unknown as Array<Record<string, string | number>>;
            const rows = getRows(newTableData);
            setTableRows(rows);
            store.ui.setTableRows(rows);
            store.data.setTableData(newTableData);
            return rows;
        });
    }

    const handleCellsChanged = (event: CellChange[]) => {
        if (event.length > 1) return;
  
        const { columnId, newCell, rowId } = event[0];
        if (newCell.type === 'dropdown') {
          setHelperCntr(() => {
            const newCount = helperCntr + 1;
            const dropDownRow = tableRows[1] as Row<DropdownCell>;
            const colIdx = tableColumns.findIndex((col) => col.columnId === columnId);
            dropDownRow.cells[colIdx] = newCell;
            const dataRows = tableRows.slice(2);
            const newDropdownValues = dropDownRow.cells.map((cell) => cell.selectedValue) as string[];

            setTableDropdownValues(newDropdownValues);
            store.ui.setTableDropdownValues(newDropdownValues);
            // TODO: Update the values to link with the data
            
            // ------------------------
            const newRows = [tableRows[0], dropDownRow, ...dataRows] as Row[];
            setTableRows(newRows);
            store.ui.setTableRows(newRows);
            return newCount;
          });
        }
        else if (rowId === 'header') {
            // update the header text
        }
        else {
            // update the cell text
            const newVal = (newCell as TextCell).text;
            console.log('normal cell', newVal)
            // set the dropdown value for the corresponding column as "input"
            setTableDropdownValues((prev) => {
                const newModes = [...prev];
                newModes[Number(columnId)] = 'input';
                return newModes;
            });

            
            const newData = [...store.data.tableData];
            newData[Number(rowId)][columnId] = newVal;
            updateTable(newData);
            store.requestExec()
                
        }
    }


    return (
        <>
            {store.ui.showFileData && <Modal open={store.ui.showFileData}
               onCancel={() => store.ui.setShowFileData(false)}
               width={'60%'}
               title={<span style={{fontFamily: 'Roboto Mono'}}>{store.data.dataFilename}</span>}
               style={{
                minHeight: '50vh',
               }}
               >

                <Table dataSource={getRenderedTableData(store.data.fileData)}
                    columns={store.data.fileData.length > 0 ? Object.keys(store.data.fileData[0]).map((col) => ({
                        title: col,
                        dataIndex: col,
                    })) : []} 
                    size="small"
                    sortDirections={['ascend', 'descend']}
                    style={{
                        marginTop: '16px',
                        overflow: 'auto',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#9A14E2',
                }}/>
            </Modal>}
            <div className={`control-panel-${flag}`} style={{ textAlign: 'center'}}>
                <Divider style={dividerStyle} orientation="left">
                <span>Data&nbsp;&nbsp;</span>
                </Divider>
               
              
            </div>
            <div>
            <Space direction="horizontal" style={{
                    marginBottom: '8px',
                }}>
                        {/* <Button style={{
                            paddingLeft: 8,
                            paddingRight: 8,
                            textAlign: 'left'
                }}
                onClick={() => {
                    
                }}><UndoOutlined />Randomize </Button> */}
                   
                    <Upload onChange={(e) => {
                        if (e.file.status === 'uploading' || (! e.fileList.length) || (!e.fileList[0])) return
                        
                        const file = e.fileList[0];
                        const reader = new FileReader();
                        store.data.setDataFilename(file.name);
                        reader.onload = (e) => {
                            const csvData = e.target?.result as string;
                            const uploadedData = d3.csvParse(csvData, d3.autoType) as Array<Record<string, string | number>>;
                            store.data.setFileData(uploadedData);                           
                            updateTable(uploadedData)
                            setFlag(flag + 1)
                        }
                        reader.readAsText(file.originFileObj as Blob);
                        
                    }}
                        accept=".csv"
                        maxCount={1}
                        showUploadList={false}
                        action=""
                    > 
                        <Button type="default" style={{
                            paddingLeft: 0,
                            paddingRight: 4,
                            textAlign: 'left',
                        }}> <TableOutlined /> {store.data.fileData.length > 0 ? 'Update Table' : 'Upload Table'}
                        </Button> 
                    </Upload>
                    { store.data.fileData.length > 0 && <>
                        <Button 
                            type="text" 
                            style={{
                                paddingLeft: 0,
                                paddingRight: 8,
                                textAlign: 'left',
                            }}
                            onClick={() => {
                                store.ui.setShowFileData(!store.ui.showFileData);
                            }}> <EyeOutlined />
                        </Button>

                    
                    </>}

                    <Button size="small" type="text" onClick={() => {
                   // add a new row to the table
                   const newRow = {
                    rowId: tableRows.length.toString(),
                    cells: Object.keys(tableRows[0].cells).map((col) => {
                        return {
                            type: "text",
                            text: ''
                        } as TextCell
                    })
                   } as Row;
                   setTableRows([...tableRows, newRow])
                   store.ui.setTableRows([...tableRows, newRow])
                   store.data.setTableData([...store.data.tableData, {}])
                   setFlag(flag + 1)      
                }}><PlusOutlined /> Row </Button>
                <Button size="small" type="text" onClick={() => {
                    if (store.data.fileData.length === 0) {
                        store.ui.notify('No data uploaded')
                        return
                    }
                    const names = Object.keys(store.data.fileData[0])
                    const dataNames = Object.keys(store.data.tableData[0])
                    const diff = dataNames.filter((name) => !names.includes(name))
                    if (diff.length > 0) {
                        store.ui.notify('The column name of the dataTable is not existed in the uploaded file')
                        return
                    }
                    store.updateInferredTableData(store.data.fileData)
                }}><CopyOutlined /> Apply</Button>

                </Space>
            </div>

            <ReactGrid
                rows = {tableRows}
                columns = {tableColumns}
                onColumnResized={handleColumnResize}
                onRowsReordered={handleRowsReorder}
                // onColumnsReordered={handleColumnsReorder}
                canReorderRows={handleCanReorderRows}
                enableFullWidthHeader
                stickyTopRows={2}
                onCellsChanged={handleCellsChanged}
                // enableRowSelection
                enableColumnSelection
            />
        </>
    )
})

export default TableEditor;

