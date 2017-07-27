### Node.js discovery system designed to work with with thorin.io (thorin-plugin-discovery and thorin-plugin-cluster plugins)

## Requirements:
- Redis server

## API Documentation
- docs/actions.md

## Docker container
- Located in snupa/discovery
- Run with:
```
docker run -e "REDIS_HOST=host" -e "DISCOVERY_KEY=YOUR_DISCOVERY_KEY" -p 18000:18000 --rm snupa/discovery
```