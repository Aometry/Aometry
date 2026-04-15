# Build Stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN apk add --no-cache git
RUN npm ci

COPY tsconfig.json ./
COPY .eslintrc.js ./
COPY src ./src
COPY installed_modules ./installed_modules

RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./
RUN apk add --no-cache git
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

# Runtime directories (persisted with bind mounts in compose)
RUN mkdir -p installed_modules logs

EXPOSE 3000

CMD ["npm", "start"]
