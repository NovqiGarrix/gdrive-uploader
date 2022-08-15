FROM node:lts-alpine3.16 AS builder

WORKDIR /app

COPY . .

RUN yarn install && yarn build

FROM node:lts-alpine3.16 AS runner

WORKDIR /app

COPY package.json .
COPY --from=builder /app/build/ build

HEALTHCHECK --interval=30s --timeout=2s --start-period=10s --retries=10 CMD curl -f http://localhost:${PORT}/health

RUN yarn install --prod

CMD yarn start

