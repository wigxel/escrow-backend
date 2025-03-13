FROM node:22-alpine

WORKDIR /

COPY package*.json .

RUN npm install -g pnpm bun && pnpm install

COPY . .

RUN pnpm run build

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
