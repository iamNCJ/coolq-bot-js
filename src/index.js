const { App } = require('koishi')
const fs = require('fs')
const axios = require('axios')
const bullshit = require('./bullshit');
const interpreter = require('PyJS').interpreter

const app = new App({
  type: 'http',
  port: 8080,
  server: 'http://localhost:5700',
  access_token: '',
  secret: '',
  commandPrefix: '.'
})

var isDebug = false
var responceData = {}

function loadData() {
  fs.readFile('./data.json', 'utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err)
        responceData = {}
    } else {
      try {
        responceData = JSON.parse(jsonString)
      } catch (error) {
        console.log('Error parsing JSON string:', err)
        responceData = {}
      }
    }
    console.log('File data:', responceData)
  })
}

function saveData() {
  const jsonString = JSON.stringify(responceData)
  fs.writeFile('./data.json', jsonString, err => {
    if (err) {
        console.log('Error writing file', err)
        return false
    } else {
        console.log('Successfully wrote file')
    }
  })
  return true
}

function init() {
  loadData()
  setInterval(() => {
    console.log('Saving files automatically...')
    saveData()
  }, 300000) // 300000ms -> 5min
  app.start()
  console.log('Bot started...')
}

app.command('echo <message>')
  .action(({ meta }, message) => meta.$send(message))

// add command
app.command('add <keyword> <response>')
  .action(({ meta }, keyword, response) => {
    if (meta.messageType === 'group') {
      if (response === undefined) {
        meta.$send(`[CQ:at,qq=${meta.userId}] 你差参数！`)
      } else {
        let groupId = meta.groupId;
        if (!responceData[groupId]) responceData[groupId] = {}
        if (!responceData[groupId][keyword]) responceData[groupId][keyword] = []
        if (responceData[groupId][keyword].indexOf(response) + 1) {
          meta.$send(`[CQ:at,qq=${meta.userId}] 我已经会说这个了！`)
        } else {
          responceData[groupId][keyword].push(response)
          // console.log(responceData) // debug
          meta.$send(`[CQ:at,qq=${meta.userId}] 你说${keyword}，我说${response}`)
        }
      }
    }
  })

// del command
app.command('del <keyword> <response>')
  .action(({ meta }, keyword, response) => {
    if (meta.messageType === 'group') {
      let groupId = meta.groupId;
      if (response === undefined) {
        meta.$send(`[CQ:at,qq=${meta.userId}] 你差参数！`)
      } else if (!responceData[groupId] || !responceData[groupId][keyword]) {
        meta.$send(`[CQ:at,qq=${meta.userId}] 我本来就不会说这个！`)
      } else { // keyword is in data
        // console.log(responceData[groupId][keyword].indexOf(responce))
        if (response == '/all') { // delete all
          delete responceData[groupId][keyword]
          meta.$send(`[CQ:at,qq=${meta.userId}] 我再也不回应${keyword}啦`)
        } else if (responceData[groupId][keyword].indexOf(response) + 1) {
          // responce is in data
          responceData[groupId][keyword] = 
            responceData[groupId][keyword].filter(function(value, index, arr){
              return value != response
            })
            if (responceData[groupId][keyword].length === 0) { // check empty array
              delete responceData[groupId][keyword]
            }
          meta.$send(`[CQ:at,qq=${meta.userId}] 你说${keyword}，我也不说${response}`)
        } else { // keyword in data but responce not in
          meta.$send(`[CQ:at,qq=${meta.userId}] 我本来就不会说这个！`)
        }
      }
      // console.log(responceData) // debug
    }
  })

// message parser
app.prependMiddleware((meta, next) => {
  if (isDebug) {
    console.log(meta.message)
  }
  if (meta.messageType === 'group') {
    msg = meta.message
    // at handler
    if (msg.includes(`[CQ:at,qq=${app.options.selfId}]`)) {
      return meta.$send(`[CQ:at,qq=${meta.userId}] @我干啥`)
      // TODO add Turing module
    } else if (msg[0] === '.') {
      return next()
    } else {
      let groupId = meta.groupId;
      let groupData = responceData[groupId];
      for (const key in groupData) {
        // if (!groupData[key] || groupData[key].length === 0) continue;
        if (msg.includes(key)) {
          // console.log(key)
          // console.log(groupData[key][~~(Math.random() * groupData[key].length)])
          return meta.$send(groupData[key][~~(Math.random() * groupData[key].length)])
        }
      }
    }
  }
  return next()
})

// save command
app.command('save')
  .action(({ meta }) => {
    if (meta.messageType === 'group') {
      if (saveData()) {
        return meta.$send('保存啦！')
      } else {
        return meta.$send('写文件失败，快帮我@管理员！')
      }
    }
  })

// repeater
var repeaterData = {}

app.middleware((meta, next) => {
  const repeatThreshold = 2        // 触发次数
  const atThreshold = 3            // Q人次数
  const interruptThreshold = 6     // 打破次数
  const interruptThresholdPlus = 8 // 超级Q人
  if (meta.messageType === 'group') { 
    // repeater only works for group message
    let groupId = meta.groupId;
    let msg = meta.message
    // console.log(msg)
    if (!repeaterData[groupId]) { // this group is not initialized
      repeaterData[groupId] = {
        times: 1,
        message: msg
      }
    } else { // has been initialized
      if (msg === repeaterData[groupId].message) {
        // is repeating
        repeaterData[groupId].times += 1
        // console.log(repeaterData[groupId].times)
        if (repeaterData[groupId].times === repeatThreshold) { 
          // repeat at repeatThreshold
          return meta.$send(msg)
        } else if (repeaterData[groupId].times == interruptThreshold) {
          // interupt at interruptThreshold
          return meta.$send('打断复读')
        } else if (repeaterData[groupId].times == interruptThresholdPlus) {
          // Q人
          return meta.$send(`[CQ:at,qq=${meta.userId}] 在？为什么还在复读？`)
        }
      } else { // repeating broken
        let lastTimes = repeaterData[groupId].times
        repeaterData[groupId].times = 1
        repeaterData[groupId].message = msg
        if (lastTimes > atThreshold) {
          // 超级Q人
          return meta.$send(`[CQ:at,qq=${meta.userId}] 在？为什么打断复读？就这么对待群友的劳动成果？`)
        } else {
          return next()
        }
      }
    }
  }
})

// get responce from https
async function httpsGet(url) {
  const getData = async url => {
    var data = ''
    try {
      const response = await axios.get(url)
      data = response.data
      // console.log(data)
    } catch (error) {
      console.log(error)
    }
    return data
  }
  const data = getData(url)
  return data
}

// dirty word command
app.command('fuck')
  .option('-f, --force')
  .action( async ({ meta, options }) => {
    if (meta.messageType === 'group') {
      // console.log(options)
      if (options.force) {
        const url = 'https://nmsl.shadiao.app/api.php?level=min'
        var data = await httpsGet(url)
        // console.log(data)
        return meta.$send(data)
      } else {
        return meta.$ban(60) // ban for 1min
      }
    }
  })

// chicken soup command
app.command('soup')
  .action( async ({ meta }) => {
    if (meta.messageType === 'group') {
      const url = 'https://du.shadiao.app/api.php'
      var data = await httpsGet(url)
      // console.log(data)
      return meta.$send(data)
    }
  })

// 彩虹屁 command
app.command('love')
  .action( async ({ meta }) => {
    if (meta.messageType === 'group') {
      const url = 'https://chp.shadiao.app/api.php'
      var data = await httpsGet(url)
      // console.log(data)
      return meta.$send(data)
    }
  })

// wechat moments command
app.command('saohua')
  .action( async ({ meta }) => {
    if (meta.messageType === 'group') {
      const url = 'https://pyq.shadiao.app/api.php'
      var data = await httpsGet(url)
      // console.log(data)
      return meta.$send(data)
    }
  })

// debug command
app.command('debug')
  .action( async ({ meta }) => {
    if (meta.messageType === 'group') {
      isDebug = !isDebug
      return meta.$send(isDebug ? 'Debugging' : 'Stopped Debugging')
    }
  })

// BullShit command
app.command('bullshit <keyword>')
  .option('-l, --length [300]')
  .action( async ({ meta, options }, keyword) => {
    if (meta.messageType === 'group') {
      if (keyword === undefined) {
        return meta.$send(`[CQ:at,qq=${meta.userId}] 给我个主题啊！`)
      } else {
        passage = ''
        if (options.length * 1) { // check if value is number
          passage = bullshit.genPassage(keyword, options.length * 1)
        } else {
          passage = bullshit.genPassage(keyword)
        }
        // console.log(keyword)
        return meta.$send(passage)
      }
    }
  })

// Python command
app.command('python <longArg...>')
  .action( async ({ meta }, longArg) => {
    if (meta.messageType === 'group') {
      res = 'Python 3.8.1 (default) [NodeJS 13.0.0] on linux\n>>>'
      if (longArg !== undefined) {
        if (isDebug) console.log(longArg)
        if (longArg.includes('while') || longArg.includes('for')) {
          // forbids loop in case of infinite loop
          res = '[CQ:face,id=14]'
        } else {
          try {
            interpreter.interpret(longArg)
            res = interpreter.output
          } catch(e) {
            res = e.toString()
          }
        }
      }
      // console.log(res)
      return meta.$send(res)
    }
  })

app.command('python').alias('py')

init()
