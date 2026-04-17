FROM node:22-alpine AS build

WORKDIR /app

# Declare the variables you need as Build Arguments
ARG VITE_API_URL
ARG VITE_WS_URL

# Set them as Environment Variables for the build process
# Vite will only pick up variables starting with VITE_
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build application
COPY . .
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]