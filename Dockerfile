FROM node:22-alpine

WORKDIR /

COPY package*.json .

RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start"]
