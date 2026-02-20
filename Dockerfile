FROM node:20-alpine

WORKDIR /app

# Install dependencies for oracledb thin mode (pure JS, no Oracle Client needed)
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
