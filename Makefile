PKG_ID := $(shell yq e ".id" < manifest.yaml 2>/dev/null || echo "kindle-md-reader")
PKG_VERSION := $(shell yq e ".version" < manifest.yaml 2>/dev/null || echo "0.1.0")
S9PK := $(PKG_ID).s9pk

.DELETE_ON_ERROR:

all: pack

docker-images/aarch64.tar: Dockerfile docker_entrypoint.sh app/package.json app/package-lock.json app/server.js
	mkdir -p docker-images
	docker buildx build --platform=linux/arm64 --tag start9/$(PKG_ID)/main:$(PKG_VERSION) -o type=docker,dest=$@ .

docker-images/x86_64.tar: Dockerfile docker_entrypoint.sh app/package.json app/package-lock.json app/server.js
	mkdir -p docker-images
	docker buildx build --platform=linux/amd64 --tag start9/$(PKG_ID)/main:$(PKG_VERSION) -o type=docker,dest=$@ .

pack: scripts/embassy.js docker-images/aarch64.tar docker-images/x86_64.tar
	start-sdk pack

verify: pack
	start-sdk verify s9pk $(S9PK)

clean:
	rm -rf docker-images $(S9PK)
