FROM fholzer/nginx-brotli:latest

RUN mkdir /sitename
RUN mkdir /sitename/html /logs /sitename/static /etc/nginx/include

COPY nginx.conf /etc/nginx/nginx.conf
COPY sitename.conf /etc/nginx/include/