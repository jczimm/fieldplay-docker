#!/bin/sh
docker buildx build --push --platform linux/amd64,linux/arm64/v8 --tag jczimm/fieldplay:latest .