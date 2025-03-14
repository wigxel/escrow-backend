FROM node:22

WORKDIR /

COPY package*.json .
## Add the tigerbeetle patches
COPY patches ./patches

RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm rebuild && pnpm run build

ENV PORT=8080
EXPOSE $PORT

CMD ["pnpm", "run", "start"]
