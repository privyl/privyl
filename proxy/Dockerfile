# Privyl proxy: masks personal data between your app and the AI API.
#
#   docker build -t privyl-proxy https://github.com/privyl/privyl.git#main:proxy
#   docker run --rm -p 127.0.0.1:8787:8787 privyl-proxy
#
# Then: ANTHROPIC_BASE_URL=http://127.0.0.1:8787/anthropic
#       OPENAI_BASE_URL=http://127.0.0.1:8787/openai/v1
#
# Nothing is written to disk. The container needs no secrets: your app keeps sending its own
# API key, and the proxy passes it on.

FROM node:22-alpine

# The proxy ships in the privyl npm package (0.2.0 or newer).
ARG PRIVYL_VERSION=0.2.0
RUN npm install --global "privyl@${PRIVYL_VERSION}" && npm cache clean --force

USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8787/health || exit 1

# 0.0.0.0 inside the container. Publish it only to your machine (-p 127.0.0.1:8787:8787)
# or to a private network, never to the open internet.
ENTRYPOINT ["privyl", "proxy", "--host", "0.0.0.0"]
