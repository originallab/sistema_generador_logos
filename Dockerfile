# Imagen base oficial de Node
FROM node:18

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia archivos de dependencias
COPY package*.json ./

# Instala dependencias
RUN npm install

# Copia el resto del proyecto
COPY . .

# Expone el puerto (ajústalo si tu server usa otro)
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["node", "server.js"]
