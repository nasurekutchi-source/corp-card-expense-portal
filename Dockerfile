FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat fontconfig font-noto

# Install dependencies at build time (cached in Docker layer)
COPY package.json package-lock.json* ./
RUN npm install --include=dev

EXPOSE 3000

# Dev: hot-reload with volume mount overriding /app source
CMD ["npm", "run", "dev"]
