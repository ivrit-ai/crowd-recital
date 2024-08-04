from dependency_injector import containers, providers

from .resource_access.db.database import Database
from .resource_access.documents_ra import DocumentsRA


class Container(containers.DeclarativeContainer):

    wiring_config = containers.WiringConfiguration(modules=[".endpoints"])

    config = providers.Configuration()

    db = providers.Singleton(Database, connection_str=config.db.connection_str)

    documents_ra = providers.Factory(
        DocumentsRA,
        session_factory=db.provided.session,
    )
