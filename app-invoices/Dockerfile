FROM node:lts-alpine as base

# ------------------ layer caching ------------------

FROM base as deps

WORKDIR /app

COPY package*.json ./

# Para não instalar as dependências de desenvolvimento
RUN npm install --omit=dev 

# ------------------ layer caching ------------------
# Aplicação de fato
FROM base as runner
WORKDIR /app

ENV NODE_ENV=production
# Seta permissão de escrita
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api

RUN chown api:nodejs .
# Copia todo o codigo da aplicação
COPY --chown=api:nodejs . .
# Copia as dependências de deps
COPY --from=deps /app/node_modules ./node_modules

USER api

EXPOSE 3333

ENV PORT=3333
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["npm", "run", "start"]

