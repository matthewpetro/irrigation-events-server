FROM node:20

WORKDIR /usr/src/app

COPY . .

RUN npm ci
RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]