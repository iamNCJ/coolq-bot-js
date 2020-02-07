const { App } = require('koishi')
var mysql = require('mysql');

const app = new App({
  type: 'http',
  port: 8080,
  server: 'http://localhost:5700',
  access_token: '',
  secret: '',
  commandPrefix: '.'
})

app.start()

var con = mysql.createConnection({
  host: "192.168.0.156",
  user: "root",
  password: "123456"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
// app.receiver.on('message', (meta) => {
//   // 如果收到“人有多大胆”
//   console.log(meta.message)
//   console.log('')
//   if (meta.message === '人有多大胆') {
//     // 就回应“地有多大产”
//     meta.$send('地有多大产')
//   }
// })

app.command('echo <message>')
  .action(({ meta }, message) => meta.$send(message))

app.middleware((meta, next) => {
  if (meta.message.includes(`[CQ:at,qq=${app.options.selfId}]`) || meta.message[0] === '.') {
    // 仅当接收到的信息包含 at 机器人时才继续处理
    console.log(meta.message)
    return next()
  }
})

let times = 0 // 已复读次数
let message = '' // 当前信息

app.prependMiddleware((meta, next) => {
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

// app.middleware(async (meta, next) => {
//   // 获取数据库中的用户信息
//   // 这里只是示例，事实上 Koishi 会自动获取数据库中的信息并存放在 meta.$user 中
//   const user = await app.database.getUser(meta.userId)
//   if (user.authority === 0) {
//     return meta.$send('抱歉，你没有权限访问机器人。')
//   } else {
//     return next()
//   }
// })