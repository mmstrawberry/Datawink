import { action, makeAutoObservable } from 'mobx'
import { makePersistable } from 'mobx-persist-store'
import { Chat2GPT, ChatboxMsg, LLMLog, Session, SessionLog, SessionLogRaw, SessionVersion } from '../assets/constant/types'
import * as SvgUtils from '../assets/svg/svg-processing';
import { Column, Row } from '@silevis/reactgrid';
import { tableData } from '../assets/constant/dev';
import { downloadJson } from '../assets/file';
import { DevProps } from '../assets/constant/examples';
import { NewParamProps } from '../assets/llm/prompt-widget';
import { exec } from '../assets/svg/exec';
import { ChatResult, AnthropicMessageParam } from '../assets/llm/index';

import { configure } from "mobx"
import { CANVAS_ID } from '../assets/constant/variables';

configure({
    enforceActions: "never",
})

// UI State Store
class UIStore {
  isQuerying: boolean = false
  hasUploadedRef: boolean = false
  configMode: string = 'Template'
  showFileData: boolean = false
  tableRows: Array<Row> = []  // displayed rows in the UI table
  tableColumns: Array<Column> = []  // displayed columns in the UI table
  tableDropdownValues: Array<string> = []  // dropdown values in the UI table
  notifyFlag: number = 0
  notifyMessage: string = ""
  notifyType: string = "error"
  loadingPercent: number = 0
  flagTableUI: number = 0
  currentVersion: string = "1"
  progressMsg: string[] = []
  activeCanvasTab: string = 'source'
  activeVersion: string = "1"

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
    makePersistable(this, {
      name: "WinkUIStore",
      properties: ["activeCanvasTab", "hasUploadedRef", "configMode", "showFileData", "tableRows", "tableColumns", "tableDropdownValues"],
      storage: window.localStorage,
    })
  }
  
  setIsQuerying = action((isQuerying: boolean) => {
    this.isQuerying = isQuerying
  }) 

  
  setHasUploadedRef = action((hasUploadedRef: boolean) => {
    this.hasUploadedRef = hasUploadedRef
  })

  
  setConfigMode = action((configMode: string) => {
    this.configMode = configMode
  })

  
  setShowFileData = action((showFileData: boolean) => {
    this.showFileData = showFileData
  })
  
  setTableRows = action((tableRows: Array<Row>) => {
    this.tableRows = tableRows.map(row => ({
      ...row,
      cells: [...row.cells]
    }));
  })

  setTableColumns = action((tableColumns: Array<Column>) => {
    this.tableColumns = tableColumns.map(column => ({
      width: column.width,
      resizable: column.resizable,
      columnId: column.columnId.toString()
    }));
  })

  setTableDropdownValues = action((tableDropdownValues: Array<string>) => {
    this.tableDropdownValues = [...tableDropdownValues];
  })

  setActiveCanvasTab = action((activeCanvasTab: string) => {
    this.activeCanvasTab = activeCanvasTab
  })

  notify = action((message: string, notifyType: string="error") => {
    this.notifyMessage = message
    this.notifyFlag++
    this.notifyType = notifyType
  })

  updateCurrentVersion = action((version: string) => {
    this.currentVersion = version
  })

  updateLoadingPercent = action((percent: number, msg: string="") => {
    this.loadingPercent += percent
    if (msg) {
      this.progressMsg.push(msg)
    }
    if (this.loadingPercent > 100) {
      this.loadingPercent = 0
      setTimeout(() => {
        this.progressMsg = []
      }, 2000)
    }
  })

}

// Data Store
class DataStore {
  rawString: string = ""
  cleanSvgString: string = ""
  chatHistory: Chat2GPT[] = []
  fileData: Array<Record<string, string | number>> = []  // user uploaded data
  tableData: Array<Record<string, string | number>> = tableData // parsed table data from the reference
  columnTemplate: Array<string> = []
  dataFilename: string = ''
  newParams: Array<NewParamProps> = []
  layeredSvgString: string = ""  // parsed layered markup SVG string of the reference
  devProps: DevProps | null = null  // dev only props
  params: Record<string, string | number> = {}  // parsed params for the code
  code: string = ""  // parsed code from the reference
  schema: Record<string, string | any> = {}  // parsed scheme from the reference
  versions: SessionVersion[] = []


  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
    makePersistable(this, {
      name: "WinkDataStore",
      properties: ["rawString", "cleanSvgString", "chatHistory", "layeredSvgString", "fileData", "tableData", "columnTemplate", "dataFilename", "devProps", "schema", "code", "params", "newParams", "versions"],
      storage: window.localStorage,
    })
  }

  get refString() {
    return SvgUtils.addIdentifier(this.rawString)
  }

  updateRawSvg = action((svg: string) => {
    this.rawString = svg
    this.cleanSvgString = svg
  })

  
  setCleanSvg = action((svg: string) => {
    this.cleanSvgString = svg
  })

  
  setFileData = action((fileData: Array<Record<string, string | number>>) => {
    this.fileData = fileData
  })

  
  setTableData = action((tableData: Array<Record<string, string | number>>) => {
    this.tableData = tableData
  })

  setColumnTemplate = action((columnTemplate: Array<string>) => {
    this.columnTemplate = columnTemplate
  })

  setDataFilename = action((dataFilename: string) => {
    this.dataFilename = dataFilename
  })

  setLayeredSvgString = action((layeredSvgString: string) => {
    this.layeredSvgString = layeredSvgString
    console.log('setLayeredSvgString', this.layeredSvgString.length)
  })

  setCode = action((code: string) => {
    this.code = code
  })

  setParams = action((params: Record<string, string | number>) => {
    this.params = params
  })

  setNewParams = action((newParams: Array<NewParamProps>) => {
    this.newParams = newParams
  })

  setParamsByKey = action((key: string, value: string | number) => {
    if(!(key in this.params)) {
      console.error(`Key ${key} not found in params`)
      return
    }
    console.log('set params', key, value)
    const copyParams = {...this.params}
    copyParams[key] = value
    this.params = copyParams
  })    

  addNewParams = action((newParams: NewParamProps[]) => {
    this.newParams = [...this.newParams, ...newParams]
    if(this.chatHistory.length > 0 && this.chatHistory[this.chatHistory.length - 1].role === 'assistant') {
      this.chatHistory[this.chatHistory.length - 1].newWidgets = [...newParams]
    }
  })

  setSchema = action((schema: Record<string, string | any>) => {
    this.schema = schema
  })

  setChatHistory = action((chatHistory: Chat2GPT[]) => {
    this.chatHistory = chatHistory
  })

  setVersions = action((versions: SessionVersion[]) => {
    this.versions = versions
  })

  updateParamByKey = action((key: string, value: string | number) => {
    if(!(key in this.params)) {
      console.error(`Key ${key} not found in params`)
      return
    }
    this.params[key] = value
  })

}


// Root Store that combines both stores
class RootStore {
  ui: UIStore
  data: DataStore
  parsedFlag: number = 0
  apiKey: string = ""
  sessionId: string = ""
  history: Session[] = []
  logs: SessionLog[] = []
  llmLogs: LLMLog[] = []
  progressMsg: string[] = []
  devFlag: number = 0
  execFlag: number = 0
  cleanupFlag: number = 0
  readonly mode: string = 'study'



  constructor() {
    this.ui = new UIStore()
    this.data = new DataStore()
    makeAutoObservable(this, {}, { autoBind: true })
    makePersistable(this, {
      name: "AppStore",
      properties: ["apiKey", "sessionId", "history"],
      storage: window.localStorage,
    })

  }

  get svgString() {
    console.log('get svgString', this.data.cleanSvgString.length)
    return this.data.cleanSvgString
  }

  get rawString() {
    console.log('get rawString', this.data.rawString.length)
    return this.data.rawString
  }

  get Messages() {
    return this.data.chatHistory
  }

  get hasDevProps() {
    return this.data.devProps !== null
  }


 // remove the interface configs
  cleanup = action(() => {
    this.data.setCleanSvg('')
    this.data.updateRawSvg('')
    this.data.setLayeredSvgString('')
    this.data.setFileData([])
    this.data.setTableData([])
    this.data.setColumnTemplate([])
    this.data.setDataFilename('')
    this.data.setCode('')
    this.data.setParams({})
    this.data.setSchema({})
    this.data.setNewParams([])
    this.data.setChatHistory([])
    this.ui.setShowFileData(false)
    this.ui.setTableRows([])
    this.ui.setTableColumns([])
    this.ui.setTableDropdownValues([])
    this.data.chatHistory = []
    this.ui.flagTableUI = 0
    this.logs = []
    this.ui.updateLoadingPercent(0)
    this.ui.progressMsg = []
    this.cleanupFlag++
  })

  updateSvg = action((svg: string) => {
    this.data.updateRawSvg(svg)
    this.parsedFlag++
  })


  updateApiKey(apiKey: string) {
    this.apiKey = apiKey
  } 

  // create a new user session
  newSession = action(() => {
    const sid = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }).replace(/ /g, '-').replace(/:/g, '')
    this.history.push({
      id: this.sessionId,
      logs: this.logs,
      baseSvg: this.data.rawString,
      versions: []
    })
    this.sessionId = sid
    this.data.devProps = null
    this.ui.setActiveCanvasTab('source')
    if (this.mode !== 'dev') {
      this.addLog({
        type: 'New Session',
        action: 'Create a New Session',
      })
    }
    this.cleanup()
  })

  downloadSession(sid: string, usrName: string="") {
    if (!sid) {
      const json = {
        sessionId: this.sessionId,
        usrName: usrName,
        history: this.history
      }
      downloadJson(json, `log-${this.sessionId}`)  
    } else {
      const session = this.history.find(h => h.id === sid)
      if (session) {
        const json = {
          sessionId: sid,
          usrName: usrName,
          history: [session]
        }
        downloadJson(json, `log-${sid}`)
      }
    }
  }

  addLog = action((log: SessionLogRaw) => {
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    const logObj = {
      ...log,
      time: now
    }
    this.logs.push(logObj)
  })

  updateDevProps = action((devProps: DevProps) => {
    this.data.devProps = devProps
    this.data.schema = devProps.schema
    this.data.code = devProps.func_string
    this.data.params = devProps.params
    this.data.setLayeredSvgString(devProps.layeredSvg)
    this.devFlag++
  })

  addLLMLog = action((prompts: AnthropicMessageParam[], res: ChatResult, time: Date) => {
    const now = new Date()
    const duration = now.getTime() - time.getTime()
    const minute = Math.floor(duration / 60000)
    const token = res.usage?.total_tokens || 0;
    const promptToken = res.usage?.prompt_tokens || 0;
    const cacheToken = res.usage?.prompt_tokens_details?.cached_tokens || 0;
    const completionToken = res.usage?.completion_tokens || 0;
    const cost = promptToken / 10000000000 * 0.15 + cacheToken / 10000000000 * 0.075 + completionToken / 10000000000 * 0.6

    let jsonObj = {}
    let flag = false

    try {
      jsonObj = JSON.parse(res.choices[0].message.content || "{}")
    } catch (e) {
      console.error('Error parsing JSON', e)
      flag = true
    }

    const chatInfo = {
        'query': prompts,
        'response': flag ? res.choices[0].message.content : jsonObj,
        'token': {
            'total': token,
            'prompt': promptToken,
            'cache': cacheToken,
            'completion': completionToken
        },
        'duration': minute,
        'cost': cost
    } as LLMLog;
    console.log('addLLMLog', chatInfo)
    this.llmLogs.push(chatInfo)
  })

  setHistory = action((history: Session[]) => {
    this.history = [...history] 
  })

  requestExec = action((isUser: boolean=true) => {
    this.execFlag++
    exec(this.data.layeredSvgString, this.data.code, this.data.params, CANVAS_ID) // plot on the canvas
    if (!isUser) return
    this.addLog({
      action: 'Request Visualization Generation Based on New Parameters',
      type: 'Request Execution',
    })
  })

  updateInferredTableData = action((tableData: Array<Record<string, string | number>>) => {
    this.data.tableData = tableData
    this.ui.flagTableUI++
  })

  addVersion = action((alias: string, description: string) => {
    const savedAt = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    const version = {
      id: String(this.data.versions.length + 1),
      alias: alias,
      description: description,
      savedAt,
      layeredSvg: this.data.layeredSvgString,
      code: this.data.code,
      params: { ...this.data.params },
      schema: { ...this.data.schema },
      data: this.data.tableData.map((row) => ({ ...row })),
      widget: []
    }
    this.data.setVersions([...this.data.versions, version])
    this.addLog({
      action: `Bookmark Version ${alias} (${description}), ID=${version.id}`,
      type: 'Bookmark Version',
    })
  })

  resetToVersion = action((idstr: string) => {
    const version = this.data.versions.find((v) => v.id === idstr)
    if (version) {
      this.data.setLayeredSvgString(version.layeredSvg)
      this.data.setCode(version.code)
      this.data.setParams({ ...version.params })
      this.data.setSchema({ ...version.schema })
      this.data.setTableData(version.data.map((row) => ({ ...row })))
      this.requestExec(false)
    }
    this.addLog({
      action: `Reset to Version ${idstr}${version ? ` (${version.alias})` : ' (not found)'}`,
      type: 'Reset to Version',
    })
  })

  addUserMsg = action((msg: ChatboxMsg) => {
    this.data.chatHistory.push(msg)
  })

  updateLastLLMMsg = action((msgStr: string) => {
    this.data.chatHistory[this.data.chatHistory.length - 1].content = msgStr
  })

}

// Create a single store instance
const store = new RootStore()

export default store

