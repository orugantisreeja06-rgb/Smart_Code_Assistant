# Simple Dockerfile for the Express backend (server.js).
# React frontend is run separately (or you can build/serve it later).

FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]

