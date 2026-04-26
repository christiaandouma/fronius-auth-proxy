ARG BUILD_FROM
FROM $BUILD_FROM

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY proxy.js makeRequest.js logger.js ./

COPY run.sh /
RUN chmod a+x /run.sh

CMD ["/run.sh"]
