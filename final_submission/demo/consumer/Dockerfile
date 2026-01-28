FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Set environment
ENV NODE_ENV=production

# Start the consumer
CMD ["npm", "start"]
