SHELL := /bin/bash

.PHONY: install install-web install-api dev dev-web dev-api build lint clean

install: install-web install-api

install-web:
	pnpm install

install-api:
	cd apps/api && go mod tidy

dev:
	@trap 'kill 0' EXIT; \
	pnpm --filter web dev & \
	(cd apps/api && go run ./cmd/api) & \
	wait

dev-web:
	pnpm --filter web dev

dev-api:
	cd apps/api && go run ./cmd/api

build:
	pnpm --filter web build
	cd apps/api && mkdir -p bin && go build -o bin/api ./cmd/api

lint:
	pnpm --filter web lint

clean:
	rm -rf apps/web/.next apps/web/node_modules apps/api/bin
