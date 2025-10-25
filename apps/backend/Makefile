# Makefile (repo root)

.PHONY: tools sqlc migrate-up migrate-down migrate-status new-migration install-local uninstall-local clean

# module paths (cmd packages)
SQLC_MODULE := github.com/sqlc-dev/sqlc/cmd/sqlc
SQLC_MOD := github.com/sqlc-dev/sqlc

GOOSE_MODULE := github.com/pressly/goose/v3/cmd/goose
GOOSE_MOD := github.com/pressly/goose/v3

# try to read pinned versions from go.mod, fallback to "latest"
SQLC_VERSION := $(shell go list -m -f '{{.Version}}' $(SQLC_MOD) 2>/dev/null || echo latest)
GOOSE_VERSION := $(shell go list -m -f '{{.Version}}' $(GOOSE_MOD) 2>/dev/null || echo latest)

# DB (override on CLI: make migrate-up DB_STRING="postgres://user:pass@host/db?sslmode=disable")
DB_DRIVER ?= postgres
DB_STRING ?= user=postgres dbname=mydb sslmode=disable

# Ensure go.mod contains your tools
tools:
	@echo "Ensuring tools are recorded in go.mod..."
	go mod tidy

# run sqlc generate without installing globally
sqlc: tools
	@echo "Running sqlc (module=$(SQLC_MODULE)@$(SQLC_VERSION))"
	go run $(SQLC_MODULE)@$(SQLC_VERSION) generate

# show migration status
migrate-status:
	@echo "goose status (module=$(GOOSE_MODULE)@$(GOOSE_VERSION))"
	go run $(GOOSE_MODULE)@$(GOOSE_VERSION) -dir ./sql/schema/ $(DB_DRIVER) "$(DB_STRING)" status

# run pending migrations up
migrate-up:
	go run $(GOOSE_MODULE)@$(GOOSE_VERSION) -dir ./sql/schema/ $(DB_DRIVER) "$(DB_STRING)" up

# run last migration down
migrate-down:
	go run $(GOOSE_MODULE)@$(GOOSE_VERSION) -dir ./sql/schema/ $(DB_DRIVER) "$(DB_STRING)" down

# create a new SQL migration (NAME=add_users_table)
new-migration:
	@test -n "$(NAME)" || (echo "Usage: make new-migration NAME=add_users_table" && exit 1)
	go run $(GOOSE_MODULE)@$(GOOSE_VERSION) -dir ./sql/schema/ $(NAME) sql

# optional: install the CLIs into ./bin (project-local), not system-wide
install-local:
	@mkdir -p ./bin
	GOBIN=$(PWD)/bin go install $(SQLC_MODULE)@$(SQLC_VERSION)
	GOBIN=$(PWD)/bin go install $(GOOSE_MODULE)@$(GOOSE_VERSION)
	@echo "Installed to ./bin — add ./bin to your PATH, or run ./bin/sqlc ..."

# remove local installs
uninstall-local:
	@rm -f ./bin/sqlc ./bin/goose || true

# wipe module cache and bin (use with care)
clean:
	@echo "Removing ./bin and cleaning module cache..."
	@rm -rf ./bin
	go clean -modcache || true
