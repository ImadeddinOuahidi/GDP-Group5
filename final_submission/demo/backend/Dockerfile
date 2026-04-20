FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Set environment
ENV NODE_ENV=development

# Start the application
CMD ["npm", "run", "dev"]
