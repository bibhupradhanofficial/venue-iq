# Use Node.js 20
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

RUN npm run build


# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start the server using our shim
CMD ["node", "server.mjs"]
