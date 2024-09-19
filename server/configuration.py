import logging

from environs import Env

env = Env()
env.read_env()


def configure_logging(container):
    logging.basicConfig()
    if container.config.debug_mode():
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)


# For out-of-di usage (See Async DB module for the CRUD api stack)
def get_db_connection_str() -> str:
    return env("DB_CONNECTION_STR")


def configure(container: "Container"):
    container.config.web_client_dist_folder.from_value(env("WEB_CLIENT_DIST_FOLDER", default="web_client_dist"))

    container.config.db.connection_str.from_value(get_db_connection_str())

    container.config.cors.allow_origins.from_value(env.list("CORS_ALLOW_ORIGINS", []))
    container.config.auth.google.client_id.from_value(env("GOOGLE_CLIENT_ID"))
    container.config.auth.delegated_identity_secret_key.from_value(env("DELEGATED_IDENTITY_SECRET_KEY"))
    container.config.auth.access_token_secret_key.from_value(env("ACCESS_TOKEN_SECRET_KEY"))

    container.config.data.root_folder.from_value(env("ROOT_DATA_FOLDER", default="data"))
    container.config.data.content_s3_bucket.from_value(env("CONTENT_STORAGE_S3_BUCKET"))
    container.config.data.content_s3_disabled.from_value(env.bool("CONTENT_DISABLE_S3_UPLOAD", default=False))

    container.config.jobs.session_finalization.disabled.from_value(
        env.bool("JOB_SESSION_FINALIZATION_DISABLED", default=False)
    )
    container.config.jobs.session_finalization.interval_sec.from_value(
        env.int("JOB_SESSION_FINALIZATION_INTERVAL_SEC", default=120)
    )

    container.config.analytics.posthog.api_key.from_value(env("PUBLIC_POSTHOG_KEY"))
    container.config.analytics.posthog.host.from_value(env("PUBLIC_POSTHOG_HOST"))

    container.config.client.disable_soup.from_value(env.bool("DISABLE_SOUP", default=False))

    container.config.debug_mode.from_value(env.bool("DEBUG", default=False))

    configure_logging(container)

    return container
