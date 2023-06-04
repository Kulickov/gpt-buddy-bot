FROM node:18

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE $PORT

CMD [ "npm", "start" ]