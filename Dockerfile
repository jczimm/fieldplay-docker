# syntax=docker/dockerfile:1

FROM node:22-alpine AS build

WORKDIR /home/node

# ENV NODE_ENV=development

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# However, do NOT leverage bind mounts to package.json and package-lock.json, since can result in read-only-filesystem error.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit optional

# Run the application as a non-root user.
USER node

# Copy the rest of the source files into the image.
COPY . .

# # Expose the port that the application listens on.
# EXPOSE 8880

# # Run the application.
# CMD npm start

# Build the application
RUN rm -rf ./dist
RUN npm run build


# Now we serve it as a second step
FROM nginx:latest AS serve
COPY --from=build /home/node/dist /data/www/
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf