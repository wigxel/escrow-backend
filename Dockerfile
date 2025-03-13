FROM node:22-alpine

WORKDIR /

## Add directory required by tigerbeetle
RUN mkdir -p /proc/self/map_files/

COPY package*.json .

RUN npm install -g pnpm && pnpm install

COPY . .

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start"]
