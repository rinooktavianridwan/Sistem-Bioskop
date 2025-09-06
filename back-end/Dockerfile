FROM golang:1.24.6-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o movieapp cmd/main.go

# Install migrate CLI
RUN wget https://github.com/golang-migrate/migrate/releases/download/v4.17.1/migrate.linux-amd64.tar.gz \
    && tar -xzf migrate.linux-amd64.tar.gz \
    && mv migrate /usr/local/bin/migrate \
    && rm migrate.linux-amd64.tar.gz

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/movieapp .
COPY --from=builder /app/database/migrations ./database/migrations
COPY --from=builder /usr/local/bin/migrate /usr/local/bin/migrate
COPY .env .env
COPY uploads/ uploads/
EXPOSE 3000

# Jalankan migrate sebelum aplikasi
CMD migrate -path ./database/migrations -database "postgres://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_NAME?sslmode=disable" up && ./movieapp