# crowd-recital
Crowd-sourced Text Recital Acquisition

## Deployment

### Prerequisites

- Python >= 3.10 and < 3.12 Installed
- Docker (To build the web client static site)
- ffmpeg available on the path of the running python process (For transcoding)
- AWS bucket to upload content and keys for the principal which can upload objects to that bucket

### Setup

- Clone this repo
- Inside the `/server` directory
- Create a virtual environment and install the requirements

`pip install -r requirements.txt`

- Create a `.env` file in the `/server` directory and add the following variables

```
DB_CONNECTION_STR=<PostgreSQL Connection String>
GOOGLE_CLIENT_ID=<Google client id for the Google login app>
ACCESS_TOKEN_SECRET_KEY=<Generated secret to sign the JWT session tokens>
DELEGATED_IDENTITY_SECRET_KEY=<Secret key to for id delegation authentication (See Below)>
AWS_ACCESS_KEY_ID=<AWS access key>
AWS_SECRET_ACCESS_KEY=<AWS secret access key>
AWS_DEFAULT_REGION=<The region for the S3 bucket access>
CONTENT_STORAGE_S3_BUCKET=<AWS S3 bucket name for the uploaded content>
CONTENT_DISABLE_S3_UPLOAD=<True/False - Disable content uploading - for development purposes (False)>
JOB_SESSION_FINALIZATION_DISABLED=<True/False - enable or disable aggregations+upload jobs (True)>
JOB_SESSION_FINALIZATION_INTERVAL_SEC=<Seconds between runs of aggregation+upload jobs, read more below. (120)>
PUBLIC_POSTHOG_KEY=<optional - tracking to posthog>
PUBLIC_POSTHOG_HOST=<optional - tracking to posthog>
DEBUG=<True/False - prints db and other detailed logs (False)>
```

*JOB_SESSION_FINALIZATION_INTERVAL_SEC*: Note, the server will also immediately trigger finalization when a recording session ends when this flag is turned on to minimize latency of getting an available session preview.

- Back on the root folder
- If going with the "No Docker" deployment option - Build & run the Docker image that handles the web site static assets building.

First create a folder to contain the built web client output

`mkdir web_client_dist`

Then build & run the builder image

```
sudo docker build -t recital-web-app-builder . -f web.Dockerfile && \
sudo docker run --rm -v $(pwd)/web_client_dist:/app/dist recital-web-app-builder && \
sudo docker image rm recital-web-app-builder
```

- This will create the `web_client_dist` folder with the static assets inside

- If you run the web server with a non root user (good idea) make sure the created dist folder is owned by that user.

`sudo chown -R <user>:<group> web_client_dist`

- If you further intend on serving static files from the proxy - make sure the proxy has read/list access to that folder

- If going with the Docker deployment option - see below.

### ID Delegation Authentication

Trusted system who needs to access the API on behalf of another user will use a method which is not a normal OAuth flow for simplicity.

In that method, the delegating system (For this project, this is a Retool admin app) will send this secret key (Which you can randomly generate just like `ACCESS_TOKEN_SECRET_KEY`) and the email of the user it asks to operate on behalf of.
The two are sent with each API call on the following two headers respectively:

- `x-delegation-secret-key`
- `x-delegated-user-email`

*Note:* This is not a very strong method, but it works. Fore reference, the way to implement this is to have an identity provider that would implement an OAuth flow that would provide Retool with the credentials to work on behalf of the user.
Retool (for example) supports OAuth 2.0 authentication, it's just the implementation of the IDp on the Python server that is currently missing.
Btw, An external service provider (Like Auth0 could be used, but might cost something)

### Analytics

This project can integrate with a [PostHog](https://posthog.com/) project got analytics.
Set the proper env vars to enable this integration.

### DB Migration

If this is not the first deployment - migrate the DB in case schema changes were made.

*note:* Ensure the python venv is active before running the following.

```sh
cd server
alembic upgrade head
```

### Running the server - No Docker option
- Starting the server using uvicorn (Default port is 8000) (Make sure the virtual environment is activated)

`uvicorn --app-dir=server application:app`

Assuming you have a reverse proxy in from of the server for HTTPS/caching/static file serving - also add the following to the uvicorn command:

`--forwarded-allow-ips='*' --proxy-headers`

If you have your reverse proxy forward to a Unix Domain socket you will also add something like this:

`--uds /tmp/uvicorn.recital.sock`

**Note:** The uvicorn command runs from the root folder NOT the `server` folder.

### Running the background jobs (Optional)

*note:* Ensure the python venv is active before running the following.

The server will automatically execute those jobs for you unless disabled using the proper ENV var. If disabled you can externally schedule those jobs as described below.

- Schedule a job to execute the following admin scripts:

`python server/admin_client.py aggregate_sessions`

This will aggregate "ended" sessions or "active" sessions that are too old into "vtt" and "audio" files.

It will also transcode the audio into a "main" audio format (the best quality data) and "light" audio format (suitable for web playback).

This script deletes the audio segment files and replaces them with a single "raw source" audio file which is also kept.

- Schedule a job to upload the artifacts of the session to AWS S3

`python server/admin_client.py upload_sessions`

This script uploads text and audio artifacts into the S3 bucket under a "folder" prefix named after the session id.

Each such folder will contain a vtt file and 3 audio files (source, main and light).

### Running the server - Docker option

- Build the Docker image `Dockerfile` (The default)
- Ensure you are on the root folder

`docker build -t crowd-recital .`

- Command to run the server docker image

`docker run -p 8000:80 --env-file server/.env`

This binds the web server on the host port 8000.

- You would probably want this container to auto start when stopped so add `--restart unless-stopped` to the above command.

- Note that this server does not handle HTTPS - so a proxy (like nginx) is expected in front of it. In that case you will add to the docker run command also the following:

`--forwarded-allow-ips='*' --proxy-headers`

So that the internal container run uvicorn will be able to see the access request headers.

- Don't forget to make sure your proxy also auto starts if it's installed on the host.

## Operations

### Speaker Users

Only "speaker" and "admin" users can use the recital web UI.

To approve (or pre approve if the user did not sign up yet) a speaker user - obtain their email address. Then run:

*note:* Ensure the python venv is active before running the following.

`python server/admin_client.py approve_speaker --speaker-email their@email.com`

from the root folder.

*note*: A simple Retool app to manage users and sessions was created to simplify the above. We look into how this can be properly shared or replace it with a built-in admin abilities.

## Development

### Prerequisites

- Python >= 3.11 and < 3.12 Installed
- Node 20 available on PATH

You need to start two web servers from two shells.

### The Vite development web server
- Go into "web_client" and run "pnpm run dev"

### The FastAPI web server

- Make sure the virtual environment is activated
- Create a `cert` folder under the root
- Generate self signed certificates using the following command

`openssl req -x509 -newkey rsa:4096 -keyout cert/key.pem -out cert/cert.pem -days 365 -nodes`

- From the root folder run uvicorn using the certificates in the `cert` folder

`uvicorn --app-dir=server application:app --reload --ssl-keyfile ./cert/key.pem --ssl-certfile ./cert/cert.pem`

- Access the app on `https://localhost:5173`




