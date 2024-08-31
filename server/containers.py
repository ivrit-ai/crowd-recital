from dependency_injector import containers, providers


from models.database import Database
from resource_access.users_ra import UsersRA
from resource_access.recitals_ra import RecitalsRA
from resource_access.recitals_content_ra import RecitalsContentRA
from resource_access.documents_ra import DocumentsRA
from engines.nlp_pipeline import NlpPipeline
from engines.extraction_engine import ExtractionEngine
from engines.aggregation_engine import AggregationEngine
from managers.document_manager import DocumentManager
from managers.recital_manager import RecitalManager


class Container(containers.DeclarativeContainer):

    wiring_config = containers.WiringConfiguration(
        packages=["routers", "routers.dependencies", "utility", "utility.authentication"]
    )

    config = providers.Configuration()

    db = providers.Singleton(Database, connection_str=config.db.connection_str)

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

    nlp_pipeline = providers.Singleton(NlpPipeline)

    extraction_engine = providers.Factory(ExtractionEngine, nlp_pipeline=nlp_pipeline)
    aggregation_engine = providers.Factory(
        AggregationEngine, recitals_ra=recitals_ra, data_folder=config.data.root_folder
    )

    document_manager = providers.Factory(
        DocumentManager,
        extraction_engine=extraction_engine,
        documents_ra=documents_ra,
    )

    recital_manager = providers.Factory(
        RecitalManager,
        recitals_ra=recitals_ra,
        recitals_content_ra=recitals_content_ra,
        aggregation_engine=aggregation_engine,
    )
