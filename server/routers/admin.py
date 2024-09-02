from fastapi import APIRouter, Depends
from fastcrud import FilterConfig, crud_router

from models.database import get_async_session
from models.user import User, UserCreate, UserUpdate

from .dependencies.users import get_admin_user

router = APIRouter(dependencies=[Depends(get_admin_user)], tags=["admin"])


custom_endpoint_names = {
    "create": "",
    "read": "",
    "update": "",
    "read_multi": "",
}

users_filer_config = FilterConfig(email=None, group=None)

user_router = crud_router(
    session=get_async_session,
    model=User,
    include_in_schema=True,
    create_schema=UserCreate,
    update_schema=UserUpdate,
    updated_at_column=None,
    path="/users",
    included_methods=["create", "read", "read_multi", "update"],
    filter_config=users_filer_config,
    endpoint_names=custom_endpoint_names,
)

router.include_router(user_router)
