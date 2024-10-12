# Imagem base do Node.js
FROM node:18

# Defina o diretório de trabalho na imagem
WORKDIR /app

# Copie o package.json e package-lock.json para a imagem
COPY package*.json ./

# Instale as dependências do projeto
RUN npm install

# Copie o restante dos arquivos da aplicação
COPY . .

# Exponha a porta onde o servidor irá rodar (ajuste conforme a porta usada no seu projeto)
EXPOSE 3000

# Inicie o servidor da aplicação
CMD ["node", "api.js"]
