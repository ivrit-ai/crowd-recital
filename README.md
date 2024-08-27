# crowd-recital
Crowd-sourced Text Recital Acquisition

## Deployment

### Prerequisites

- Python >= 3.10 and < 3.12 Installed
- Docker (To build the web client static site)

### Setup

- Clone this repo
- Inside the `/server` direction
- Create a virtual environment and install the requirements

`pip install -r requirements.txt`

- Create a `.env` file in the `/server` directory and add the following variables

```
DB_CONNECTION_STR=<PostgreSQL Connection String>
GOOGLE_CLIENT_ID=<Google client id for the Google login app>
ACCESS_TOKEN_SECRET_KEY=<Generated secret to sign the JWT session tokens>
```

- Back on the root folder
- Build the Docker image that handles the web site static assets building

```
docker build -t recital-web-app-builder . && \
docker run --rm -v $(PWD)/web_client_dist:/app/dist recital-web-app-builder && \
docker image rm recital-web-app-builder
```

- This will create the `web_client_dist` folder with the static assets inside

- Starting the server using uvicorn (Default port is 8000) (Make sure the virtual environment is activated)

`uvicorn --app-dir=server application:app`

**Note:** The uvicorn command runs from the root folder NOT the `server` folder.

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




