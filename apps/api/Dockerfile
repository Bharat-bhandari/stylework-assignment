# Debian rather than Alpine: Prisma ships prebuilt engines for glibc and needs no extra
# musl handling.
FROM node:20-slim AS build

# Prisma picks its engine build from the detected OpenSSL version, and cannot detect one
# without the openssl package present.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN node_modules/.bin/prisma generate

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:20-slim AS runtime

ENV NODE_ENV=production
ENV PORT=4000

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# The schema and migrations ship with the image: the entrypoint applies them on start.
COPY prisma ./prisma
# Generated once, in the build stage, rather than again here.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY --chmod=0755 docker-entrypoint.sh ./

USER node

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
