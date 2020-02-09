const { App } = require('koishi')
const fs = require('fs')

const app = new App({
  type: 'http',
  port: 8080,
  server: 'http://localhost:5700',
  access_token: '',
  secret: '',
  commandPrefix: '.'
})

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
      console.log('File data:', responceData)
    }
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

loadData()

app.start()

app.command('echo <message>')
  .action(({ meta }, message) => meta.$send(message))

// add command
app.command('add <keyword> <responce>')
  .action(({ meta }, keyword, responce) => {
    if (meta.messageType === 'group') {
      if (responce === undefined) {
        meta.$send(`[CQ:at,qq=${meta.userId}] 你差参数！`)
      } else {
        let groupId = meta.groupId;
        if (!responceData[groupId]) responceData[groupId] = {}
        if (!responceData[groupId][keyword]) responceData[groupId][keyword] = []
        if (responceData[groupId][keyword].indexOf(responce) + 1) {
          meta.$send(`[CQ:at,qq=${meta.userId}] 我已经会说这个了！`)
        } else {
          responceData[groupId][keyword].push(responce)
          // console.log(responceData) // debug
          meta.$send(`[CQ:at,qq=${meta.userId}] 你说${keyword}，我说${responce}`)
        }
      }
    }
  })

// del command
app.command('del <keyword> <responce>')
  .action(({ meta }, keyword, responce) => {
    if (meta.messageType === 'group') {
      let groupId = meta.groupId;
      if (responce === undefined) {
        meta.$send(`[CQ:at,qq=${meta.userId}] 你差参数！`)
      } else if (!responceData[groupId] || !responceData[groupId][keyword]) {
        meta.$send(`[CQ:at,qq=${meta.userId}] 我本来就不会说这个！`)
      } else { // keyword is in data
        // console.log(responceData[groupId][keyword].indexOf(responce))
        if (responce == '/all') { // delete all
          delete responceData[groupId][keyword]
          meta.$send(`[CQ:at,qq=${meta.userId}] 我再也不回应${keyword}啦`)
        } else if (responceData[groupId][keyword].indexOf(responce) + 1) {
          // responce is in data
          responceData[groupId][keyword] = 
            responceData[groupId][keyword].filter(function(value, index, arr){
              return value != responce
            })
            if (responceData[groupId][keyword].length === 0) { // check empty array
              delete responceData[groupId][keyword]
            }
          meta.$send(`[CQ:at,qq=${meta.userId}] 你说${keyword}，我也不说${responce}`)
        } else { // keyword in data but responce not in
          meta.$send(`[CQ:at,qq=${meta.userId}] 我本来就不会说这个！`)
        }
      }
      // console.log(responceData) // debug
    }
  })

// message parser
app.prependMiddleware((meta, next) => {
  // console.log(meta.message)
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
// TODO bug: fix repeat for different group
// let times = 0 // 已复读次数
// let message = '' // 当前信息

// app.middleware((meta, next) => {
//   var repeatThreshold = 2        // 触发次数
//   var atThreshold = 3            // Q人次数
//   var interruptThreshold = 6     // 打破次数
//   var interruptThresholdPlus = 8 // 超级Q人
//   if (meta.messageType === 'group' && meta.message === message) { 
//     // repeater only works for group message
//     times += 1
//     // console.log(times)
//     // console.log(meta.userId)
//     if (times === repeatThreshold) return meta.$send(message)
//     else if (times == interruptThreshold) {
//       return meta.$send('打断复读')
//     }
//     else if (times == interruptThresholdPlus) {
//       return meta.$send(`[CQ:at,qq=${meta.userId}] 在？为什么还在复读？`)
//     }
//   } else {
//     let lastTimes = times
//     times = 1
//     message = meta.message
//     if (lastTimes > atThreshold) {
//       return meta.$send(`[CQ:at,qq=${meta.userId}] 在？为什么打断复读？就这么对待群友的劳动成果？`)
//     }
//     return next()
//   }
// })

var repeaterData = {}

// let times = 0 // 已复读次数
// let message = '' // 当前信息

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
        console.log(repeaterData[groupId].times)
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
