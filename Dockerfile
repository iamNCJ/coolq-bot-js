FROM node:13.12.0-alpine3.11
EXPOSE 8080
COPY ./src/* /app/
WORKDIR /app
RUN apk add --update \
        git \
    && npm i
ENTRYPOINT [ "npm", "start" ]
