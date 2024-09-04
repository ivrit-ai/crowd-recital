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
CONTENT_STORAGE_S3_BUCKET=<AWS S3 bucket name for the uploaded content>
```

- Back on the root folder
- Build the Docker image that handles the web site static assets building

```
docker build -t recital-web-app-builder . -f web.Dockerfile && \
docker run --rm -v $(PWD)/web_client_dist:/app/dist recital-web-app-builder && \
docker image rm recital-web-app-builder
```

- This will create the `web_client_dist` folder with the static assets inside

### About ID Delegation Authentication

Trusted system who needs to access the API on behalf of another user will use a method which is not a normal OAuth flow for simplicity.

In that method, the delegating system (For this project, this is a Retool admin app) will send this secret key (Which you can randomly generate just like `ACCESS_TOKEN_SECRET_KEY`) and the email of the user it asks to operate on behalf of.
The two are sent with each API call on the following two headers respectively:

- `x-delegation-secret-key`
- `x-delegated-user-email`

*Note:* This is not a very strong method, but it works. Fore reference, the way to implement this is to have an identity provider that would implement an OAuth flow that would provide Retool with the credentials to work on behalf of the user.
Retool (for example) supports OAuth 2.0 authentication, it's just the implementation of the IDp on the Python server that is currently missing.
Btw, An external service provider (Like Auth0 could be used, but might cost something)

## DB Migration

If this is not the first deployment - migrate the DB in case schema changes were made.

*note:* Ensure the python venv is active before running the following.

```sh
cd server
alembic upgrade head
```

### Running the server
- Starting the server using uvicorn (Default port is 8000) (Make sure the virtual environment is activated)

`uvicorn --app-dir=server application:app`

**Note:** The uvicorn command runs from the root folder NOT the `server` folder.

### Running the background jobs

*note:* Ensure the python venv is active before running the following.

- Schedule a job to execute the following admin scripts:

`python server/admin_client.py aggregate_sessions`

This will aggregate "ended" sessions or "active" sessions that are too old into "vtt" and "audio" files.

It will also transcode the audio into a "main" audio format (the best quality data) and "light" audio format (suitable for web playback).

This script deletes the audio segment files and replaces them with a single "raw source" audio file which is also kept.

- Schedule a job to upload the artifacts of the session to AWS S3

`python server/admin_client.py upload_sessions`

This script uploads text and audio artifacts into the S3 bucket under a "folder" prefix named after the session id.

Each such folder will contain a vtt file and 3 audio files (source, main and light).

## Operations

### Speaker Users

Only "speaker" and "admin" users can use the recital web UI.

To approve (or pre approve if the user did not sign up yet) a speaker user - obtain their email address. Then run:

*note:* Ensure the python venv is active before running the following.

`python server/admin_client.py approve_speaker --speaker-email their@email.com`

from the root folder.

## Development

### Prerequisites

- Python >= 3.10 and < 3.12 Installed
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




