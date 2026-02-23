FROM node:20-slim

WORKDIR /app

# System deps: libgomp1 (onnxruntime-node), fontconfig + fonts (PDF/receipt rendering), ca-certs (HTTPS model downloads)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 fontconfig fonts-noto ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies at build time (cached in Docker layer)
COPY package.json package-lock.json* ./
RUN npm install --include=dev

EXPOSE 3000

# Dev: hot-reload with volume mount overriding /app source
CMD ["npm", "run", "dev"]
