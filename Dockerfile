FROM node
EXPOSE 8080
COPY ./src/* /app/
WORKDIR /app
RUN npm install
ENTRYPOINT [ "npm", "start" ]