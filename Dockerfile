FROM node:22-bookworm-slim AS zhihu-cli-installer

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
    cli_version='0.6.0-beta.20260908125143'; \
    cli_url="https://developer-cdn.zhihu.com/zhihu-cli/releases/beta/cli/${cli_version}/zhihu-cli-${cli_version}-linux-amd64.tar.gz"; \
    cli_archive='/tmp/zhihu-cli-linux-amd64.tar.gz'; \
    cli_sha256='d21691ac3bebeac4fb29f6982da6b4e4dddf659b731cd8f65dea1c0242a7d0ba'; \
    cli_size='3000352'; \
    curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 --output "${cli_archive}" "${cli_url}"; \
    test "$(stat --format='%s' "${cli_archive}")" = "${cli_size}"; \
    echo "${cli_sha256}  ${cli_archive}" | sha256sum --check --strict -; \
    test "$(tar --gzip --list --file "${cli_archive}")" = 'zhihu-cli'; \
    tar --gzip --extract --file "${cli_archive}" --directory /usr/local/bin zhihu-cli; \
    chmod 0755 /usr/local/bin/zhihu-cli; \
    /usr/local/bin/zhihu-cli version | grep --fixed-strings "${cli_version}"; \
    rm "${cli_archive}"

FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=zhihu-cli-installer /usr/local/bin/zhihu-cli /usr/local/bin/zhihu-cli
COPY --chown=node:node versions/v2/server.js versions/v2/index.html ./versions/v2/
COPY --chown=node:node versions/v2/assets ./versions/v2/assets

ENV NODE_ENV=production
ENV ZHIHU_CLI_PATH=/usr/local/bin/zhihu-cli

USER node

CMD ["node", "versions/v2/server.js"]
