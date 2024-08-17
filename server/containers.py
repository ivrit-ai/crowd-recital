from dependency_injector import containers, providers

from .models.database import Database
from .resource_access.users_ra import UsersRA
from .resource_access.recitals_ra import RecitalsRA


class Container(containers.DeclarativeContainer):

    wiring_config = containers.WiringConfiguration(packages=[".routers", ".utility"])

    config = providers.Configuration()

    db = providers.Singleton(Database, connection_str=config.db.connection_str)

    recitals_ra = providers.Factory(
        RecitalsRA,
        session_factory=db.provided.session,
    )
    users_ra = providers.Factory(
        UsersRA,
        session_factory=db.provided.session,
    )
