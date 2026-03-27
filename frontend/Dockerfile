FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Compilamos la aplicación para producción
RUN npm run build

# Exponemos el puerto
EXPOSE 3000

# Arrancamos en modo producción
CMD ["npm", "start"]