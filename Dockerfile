FROM node
EXPOSE 8080
COPY ./bot/* /app/
WORKDIR /app
RUN npm install
ENTRYPOINT [ "npm", "start" ]