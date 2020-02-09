const { App } = require('koishi')

const app = new App({
  type: 'http',
  port: 8080,
  server: 'http://localhost:5700',
  access_token: '',
  secret: '',
  commandPrefix: '.'
})

var responceData = {}

function init() {
  var reader = new window.FileReader();
  try {
    reader.readAsText('./data.json')
    responceData = JSON.parse(reader.result)
  } catch {
    console.log('Error occured when reading data')
    responceData = {}
  }
}

init()

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
app.middleware((meta, next) => {
  if (meta.messageType === 'group') {
    msg = meta.message
    // at handler
    if (msg.includes(`[CQ:at,qq=${app.options.selfId}]`)) {
      return meta.$send(`[CQ:at,qq=${meta.userId}] @我干啥`)
      // TODO add Turing module
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
  } else {
    return next()
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


let times = 0 // 已复读次数
let message = '' // 当前信息

app.middleware((meta, next) => {
  var repeatThreshold = 2        // 触发次数
  var atThreshold = 3            // Q人次数
  var interruptThreshold = 6     // 打破次数
  var interruptThresholdPlus = 8 // 超级Q人
  if (meta.messageType === 'group' && meta.message === message) { 
    // repeater only works for group message
    times += 1
    // console.log(times)
    // console.log(meta.userId)
    if (times === repeatThreshold) return meta.$send(message)
    else if (times == interruptThreshold) {
      return meta.$send('打断复读')
    }
    else if (times == interruptThresholdPlus) {
      return meta.$send(`[CQ:at,qq=${meta.userId}] 在？为什么还在复读？`)
    }
  } else {
    let lastTimes = times
    times = 1
    message = meta.message
    if (lastTimes > atThreshold) {
      return meta.$send(`[CQ:at,qq=${meta.userId}] 在？为什么打断复读？就这么对待群友的劳动成果？`)
    }
    return next()
  }
})
