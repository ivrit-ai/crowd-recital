from dependency_injector import containers, providers

from engines.aggregation_engine import AggregationEngine
from engines.extraction_engine import ExtractionEngine
from engines.nlp_pipeline import NlpPipeline
from engines.transform_engine import TransformEngine
from managers.document_manager import DocumentManager
from managers.recital_manager import RecitalManager
from models.database import Database
from resource_access.documents_ra import DocumentsRA
from resource_access.recitals_content_ra import RecitalsContentRA
from resource_access.recitals_ra import RecitalsRA
from resource_access.stats_ra import StatsRA
from resource_access.users_ra import UsersRA
from utility.analytics.posthog import ConfiguredPosthog
from utility.communication.email import Emailer
from utility.scheduler import JobScheduler


print("Starting Container initialization")

class Container(containers.DeclarativeContainer):
    print("Defining Container class")

    wiring_config = containers.WiringConfiguration(
        packages=["routers", "routers.dependencies", "utility", "utility.authentication", "utility.communication"],
        modules=["application"],
    )
    print(f"Wiring config initialized: {wiring_config}")

    config = providers.Configuration()
    print(f"Configuration provider initialized: {config}")

    posthog = providers.Singleton(
        ConfiguredPosthog, api_key=config.analytics.posthog.api_key, host=config.analytics.posthog.host
    )
    emailer = providers.Singleton(
        Emailer, email_sender_address=config.email.sender_address, email_reply_to_address=config.email.reply_to_address
    )

    db = providers.Singleton(Database, connection_str=config.db.connection_str)
    job_scheduler = providers.Singleton(JobScheduler)

    documents_ra = providers.Factory(
        DocumentsRA,
        session_factory=db.provided.session,
    )
    recitals_ra = providers.Factory(
        RecitalsRA, session_factory=db.provided.session, data_folder=config.data.root_folder
    )
    recitals_content_ra = providers.Factory(
        RecitalsContentRA, data_folder=config.data.root_folder, content_s3_bucket=config.data.content_s3_bucket
    )
    users_ra = providers.Factory(
        UsersRA,
        session_factory=db.provided.session,
    )
    stats_ra = providers.Factory(
        StatsRA,
        session_factory=db.provided.session,
    )

    nlp_pipeline = providers.Singleton(NlpPipeline)

    extraction_engine = providers.Factory(ExtractionEngine, nlp_pipeline=nlp_pipeline)
    transform_engine = providers.Factory(TransformEngine, recitals_ra=recitals_ra, data_folder=config.data.root_folder)
    aggregation_engine = providers.Factory(
        AggregationEngine, recitals_ra=recitals_ra, data_folder=config.data.root_folder
    )

    document_manager = providers.Singleton(
        DocumentManager,
        extraction_engine=extraction_engine,
        documents_ra=documents_ra,
    )

    recital_manager = providers.Singleton(
        RecitalManager,
        session_finalization_job_disabled=config.jobs.session_finalization.disabled,
        session_finalization_job_interval=config.jobs.session_finalization.interval_sec,
        disable_s3_upload=config.data.content_s3_disabled,
        posthog=posthog,
        job_scheduler=job_scheduler,
        recitals_ra=recitals_ra,
        recitals_content_ra=recitals_content_ra,
        aggregation_engine=aggregation_engine,
        transform_engine=transform_engine,
    )

print("Container class definition completed")
