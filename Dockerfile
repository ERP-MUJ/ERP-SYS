FROM node:24-alpine3.21

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install

RUN pnpm run build

CMD ["pnpm", "run", "start"]