FROM node:13.12.0-alpine3.11
EXPOSE 8080
COPY ./src/* /app/
WORKDIR /app
RUN npm install
ENTRYPOINT [ "npm", "start" ]
