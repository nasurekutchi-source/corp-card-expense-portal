FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./

EXPOSE 3000

CMD ["sh", "-c", "npm install && npm run dev"]
