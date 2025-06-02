# docker build --no-cache -t calendar-frontend .

# 1. Build Stage
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build -- --configuration production


FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/calendar-frontend/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
