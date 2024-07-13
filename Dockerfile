FROM node:alpine as build-step
WORKDIR /app
COPY ["package.json", "yarn.lock", "./"]
RUN yarn install --frozen-lockfile
COPY . ./
RUN yarn build

FROM node:alpine
ENV NODE_ENV=production
WORKDIR /app
COPY ["package.json", "yarn.lock", "./"]
RUN yarn install --production --frozen-lockfile
COPY --from=build-step /app/dist/ .
CMD [ "node", "index.js" ]


