FROM node

WORKDIR /product

COPY package.json .

RUN npm install

COPY . .


EXPOSE 8002

CMD ["npm", "run","dev"]