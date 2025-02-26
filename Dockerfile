FROM node:20-alpine

WORKDIR /

COPY package*.json .

RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm run build

ENV PORT=3000
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
