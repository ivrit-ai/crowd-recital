##
# Ivrit.ai Crowd Recital Server Build
# Author: Yoad Snapir
# Date: 2022-03-15
#
# This sockerfile build the production docker container.
# It has two main stages:
# - Building the static web client (using Vite)
# - Installing the FastAPI web server that serves both the API endpoints
#   and the static web app at the root
##

##
# Build the Vite app static site
##

FROM node:20-slim AS build-stage
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY ./web_client .


# Cache the build deps for pnpm - subsequent builds should be faster
RUN --mount=type=cache,target=${PNPM_HOME}/store \
    pnpm config set store-dir ${PNPM_HOME}/store && \
    pnpm install --frozen-lockfile --prefer-offline

RUN pnpm run build

# At this point, static files are built into the /app/dist folder

##
# Start the production container build
##

# Python base image
FROM python:3.11-slim-bookworm AS final-stage

WORKDIR /server
COPY server/requirements.txt .
# Pre install torch using offical pytorch wheel - to match target platform
# RUN pip install torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

# Download and store the stanza models into the image
# Setup an env that also tells stanza where to download/look for modes
# during runtime
WORKDIR /
ENV STANZA_RESOURCES_DIR=stanza_resources
RUN python -c "import stanza; stanza.download('he', processors='tokenize,mwt')"

# Copy the backend code
WORKDIR /server
COPY server/ .

WORKDIR /

# Copy the built static assets from the build-stage
COPY --from=build-stage /app/dist web_client_dist/

# Specify the volume where uploaded data us to be stored
VOLUME /data

ENTRYPOINT [ "uvicorn", "server.application:app", "--host", "0.0.0.0", "--port", "80"]