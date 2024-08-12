from dependency_injector import containers, providers

from .models.database import Database
from .resource_access.documents_ra import DocumentsRA
from .resource_access.users_ra import UsersRA


class Container(containers.DeclarativeContainer):

    wiring_config = containers.WiringConfiguration(packages=[".routers", ".utility"])

    config = providers.Configuration()

    db = providers.Singleton(Database, connection_str=config.db.connection_str)

    documents_ra = providers.Factory(
        DocumentsRA,
        session_factory=db.provided.session,
    )
    users_ra = providers.Factory(
        UsersRA,
        session_factory=db.provided.session,
    )
