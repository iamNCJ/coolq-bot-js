# QQ Bot - based on CoolQ HTTP plugin and Javascript

## Functions

- super repeater
- command
  - `add`
  - `del`
  - `save`

## Deploy

- Set `post_url` in HTTP Plugin

```bash
git clone https://github.com/iamNCJ/coolq-bot-js.git
cd coolq-bot-js/bot/
npm install
npm start
```

### Using Docker

Set `post_url` in HTTP Plugin

```bash
git clone https://github.com/iamNCJ/coolq-bot-js.git
cd coolq-bot-js/
docker build -t bot .
docker run -d -p 8080:8080 bot
```

## Reference

[https://koishi.js.org/](https://koishi.js.org/)

[https://github.com/suulnnka/BullshitGenerator/](https://github.com/suulnnka/BullshitGenerator/)