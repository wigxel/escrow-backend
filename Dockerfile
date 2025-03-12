FROM node:22-alpine

WORKDIR /

COPY package*.json .

RUN npm install -g pnpm bun && pnpm install

COPY . .

RUN pnpm run build

ENV PORT=${PORT:-3000}
EXPOSE ${PORT}

CMD ["bun", ".output/server/index.mjs"]
