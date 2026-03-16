IMAGE=kindle-md-reader:0.1.0
PLATFORMS=linux/amd64,linux/arm64
S9PK=kindle-md-reader.s9pk

image:
	docker buildx build --platform=$(PLATFORMS) -t $(IMAGE) -o type=docker,dest=image.tar .

pack:
	start-sdk pack

verify:
	start-sdk verify s9pk $(S9PK)

clean:
	rm -f image.tar $(S9PK)
