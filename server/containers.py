from dependency_injector import containers, providers


from .models.database import Database
from .resource_access.users_ra import UsersRA
from .resource_access.recitals_ra import RecitalsRA
from .resource_access.documents_ra import DocumentsRA
from .engines.extraction_engine import ExtractionEngine
from .managers.document_manager import DocumentManager


class Container(containers.DeclarativeContainer):

    wiring_config = containers.WiringConfiguration(packages=[".routers", ".utility"])

    config = providers.Configuration()

    db = providers.Singleton(Database, connection_str=config.db.connection_str)

    documents_ra = providers.Factory(
        DocumentsRA,
        session_factory=db.provided.session,
    )
    recitals_ra = providers.Factory(
        RecitalsRA,
        session_factory=db.provided.session,
    )
    users_ra = providers.Factory(
        UsersRA,
        session_factory=db.provided.session,
    )

    extraction_engine = providers.Factory(ExtractionEngine)

    document_manager = providers.Factory(
        DocumentManager,
        extraction_engine=extraction_engine,
        documents_ra=documents_ra,
    )
