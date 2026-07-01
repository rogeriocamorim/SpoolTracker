# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build with production API URL (will be overridden at runtime via nginx)
ARG VITE_API_URL=http://localhost:8080/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Self-signed fallback cert so nginx can start even without a mounted
# volume (docker-compose.yml mounts real certs at this path, overriding this)
RUN apk add --no-cache openssl \
    && mkdir -p /etc/nginx/ssl \
    && openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/key.pem -out /etc/nginx/ssl/cert.pem \
        -subj "/CN=spooltracker"

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]


