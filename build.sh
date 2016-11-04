#!/bin/bash
docker build --no-cache -t snupa/discovery .
docker push snupa/discovery
