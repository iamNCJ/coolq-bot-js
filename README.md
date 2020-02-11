# QQ Chatbot - based on CoolQ HTTP plugin and JavaScript

## Functions

- super repeater
- command
  - `add keyword response`
    - when bot hears about keyword he will respond the response
  - `del keyword response`
    - delete the corresponding response
  - `save`
    - save current data into `data.json`
    - will be run automatically every 5 minutes
  - `bullshit theme`
    - uses famous [BullshitGenerator](https://github.com/menzi11/BullshitGenerator) and transplanted it into this project using its [JavaScript version](https://github.com/suulnnka/BullshitGenerator)
    - `--length` or `-l` to specify the length of the generated passage
  - `soup`, `love`, etc.
    - using APIs from [https://shadiao.app/](https://shadiao.app/)
    - send the content to group chats when triggered
- Python Interpreter
  - Using [PyJS](http://projects.yzyzsun.me/pyjs/) backend
  - forbids loop in case of infinite loop

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

> You can attach volumes or bind disks into the container so that you can have your data stored outside the container or extract it
>
> Also, it's better to tune your container's time zone to make logs more readable

## Reference

[https://koishi.js.org/](https://koishi.js.org/)

[https://github.com/yzyzsun/PyJS](https://github.com/yzyzsun/PyJS)

[https://github.com/suulnnka/BullshitGenerator](https://github.com/suulnnka/BullshitGenerator)

[https://shadiao.app/](https://shadiao.app/)