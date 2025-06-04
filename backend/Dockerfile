# Stage 1: Build Stage
FROM node:22-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies only for the build stage
RUN npm i

# Copy the rest of the application source code
COPY . .
COPY openapi ./dist/openapi

# Build the TypeScript code
RUN npm run build

# Stage 2: Production Stage
FROM node:22-slim AS runner

# Set NODE_ENV to production by default
ENV NODE_ENV=production
ENV CONTAINER=true

# Set the working directory inside the container
WORKDIR /app

# Copy the built code and package.json from the build stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/entrypoint.sh ./

RUN chmod +x entrypoint.sh

# # Install only production dependencies
RUN npm ci --production

USER node

# Set the command to run the application
ENTRYPOINT ["./entrypoint.sh"]