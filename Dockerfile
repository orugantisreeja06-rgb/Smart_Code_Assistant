# Dockerfile for Express backend in backend/ folder
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm install

# Copy backend source code
COPY backend/. .

EXPOSE 3000

CMD ["node", "server.js"]

