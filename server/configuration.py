import logging

from environs import Env

from containers import Container

env = Env()
env.read_env()


def configure_logging(container):
    logging.basicConfig()
    if container.config.debug_mode():
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)


def configure(container: Container):
    container.config.web_client_dist_folder.from_value(env("WEB_CLIENT_DIST_FOLDER", default="web_client_dist"))
    container.config.db.connection_str.from_value(env("DB_CONNECTION_STR"))
    container.config.cors.allow_origins.from_value(env.list("CORS_ALLOW_ORIGINS", []))
    container.config.auth.google.client_id.from_value(env("GOOGLE_CLIENT_ID"))
    container.config.auth.access_token_secret_key.from_value(env("ACCESS_TOKEN_SECRET_KEY"))
    container.config.debug_mode.from_value(env.bool("DEBUG", default=False))
    container.config.data.root_folder.from_value(env("ROOT_DATA_FOLDER", default="data"))
    container.config.data.content_s3_bucket.from_value(env("CONTENT_STORAGE_S3_BUCKET"))

    configure_logging(container)

    return container
