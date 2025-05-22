# Docker Setup for ERP Backend

This README provides instructions for building and running the ERP backend using Docker.

## Prerequisites

- Docker installed on your system
- Node.js and npm installed locally (for development)

## Building the Docker Image

To build the Docker image, run the following command from the project root directory:

```bash
docker build -t myapp:v1 -f Dockerfile .
```

## Running the Container

To run the container in detached mode, exposing port 8080:

```bash
docker run -d --name erp-backend -p 8080:8080 myapp:v1
```

## Health Check

The container includes a health check that pings the `/health` endpoint. You can test it with:

```bash
curl http://localhost:8080/health
```

## Environment Variables

The container uses the following environment variables:

- `NODE_ENV`: Set to `production` by default
- `PORT`: Default is 8080
- `MONGO_URL`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token generation

## Troubleshooting

If you encounter issues when building the Docker image:

1. **Network Issues**: If you experience timeouts during the npm install process, consider:

   - Using the `--network=host` flag with Docker build
   - Pre-installing node_modules locally and copying them into the container
   - Setting npm retry configurations

2. **Missing Dependencies**: If modules are not found when starting the container:

   - Check that node_modules are properly copied to the container
   - Ensure that the .dockerignore file is not excluding necessary files
   - Use a simpler approach by copying the entire project context

3. **Health Check Failures**:
   - Make sure your application has a `/health` endpoint that returns a 200 status code
   - Check container logs with `docker logs [container_name]`

## Notes

- The image uses Alpine Linux to minimize size
- The application runs under a non-root user for security
- Local node_modules are copied to the container to avoid network issues during build

### Building and running your application

When you're ready, start your application by running:
`docker compose up --build`.

Your application will be available at http://localhost:8080.

### Deploying your application to the cloud

First, build your image, e.g.: `docker build -t myapp .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t myapp .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References

- [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)
