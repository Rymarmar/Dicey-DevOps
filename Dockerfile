FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
# Expose port 8080 so the backend is reachable inside the Docker network
EXPOSE 8080
CMD ["npm", "start"]
