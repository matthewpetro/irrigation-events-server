FROM node:20-alpine

WORKDIR /usr/src/app

RUN npm install -g pnpm
COPY . .
RUN pnpm install --frozen-lockfile
COPY .env.testing .
RUN pnpm run test
RUN rm .env.testing
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]