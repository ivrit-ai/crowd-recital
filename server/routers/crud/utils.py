import inspect
from typing import Annotated, Any, Callable, Optional, Union

from sqlalchemy import (
    or_,
)
from sqlalchemy.orm.util import AliasedClass
from sqlalchemy.sql.elements import ColumnElement
from fastapi import Depends, Query
from fastcrud import FastCRUD, FilterConfig
from fastcrud.types import (
    ModelType,
)
from pydantic import create_model

from models.user import User
from routers.dependencies.analytics import Tracker
from routers.dependencies.users import get_speaker_user


class FastCrudWithOrFilters(FastCRUD):
    def _parse_filters(
        self, model: Optional[Union[type[ModelType], AliasedClass]] = None, **kwargs
    ) -> list[ColumnElement]:
        model = model or self.model
        kwargs_rest = {}
        or_filters = []
        for key, value in kwargs.items():
            if key.startswith("__or"):
                or_filters_parsed = super()._parse_filters(model, **value)
                or_filters.append(or_(*or_filters_parsed))
            else:
                kwargs_rest[key] = value

        return super()._parse_filters(model, **kwargs_rest) + or_filters


def compute_offset(page: int, items_per_page: int) -> int:
    """Calculate the offset for pagination based on the given page number and items per page.

    The offset represents the starting point in a dataset for the items on a given page.
    For example, if each page displays 10 items and you want to display page 3, the offset will be 20,
    meaning the display should start with the 21st item.

    Args:
        page: The current page number. Page numbers should start from 1.
        items_per_page: The number of items to be displayed on each page.

    Returns:
        The calculated offset.

    Examples:
        >>> offset(1, 10)
        0
        >>> offset(3, 10)
        20
    """
    return (page - 1) * items_per_page


def paginated_response(crud_data: dict, page: int, items_per_page: int) -> dict[str, Any]:
    """Create a paginated response based on the provided data and pagination parameters.

    Args:
        crud_data: Data to be paginated, including the list of items and total count.
        page: Current page number.
        items_per_page: Number of items per page.

    Returns:
        A structured paginated response dict containing the list of items, total count, pagination flags, and numbers.

    Note:
        The function does not actually paginate the data but formats the response to indicate pagination metadata.
    """
    return {
        "data": crud_data["data"],
        "total_count": crud_data["total_count"],
        "has_more": (page * items_per_page) < crud_data["total_count"],
        "page": page,
        "items_per_page": items_per_page,
    }


def create_dynamic_filters_dep(
    filter_config: Optional[FilterConfig],
    inject_current_user: bool = False,
    preprocess_filters: Optional[Callable] = None,
) -> Callable[..., dict[str, Any]]:
    if filter_config is None:
        return lambda: {}

    def filters(
        **kwargs: Any,
    ) -> dict[str, Any]:
        kwargs_to_use = kwargs.copy()
        filtered_params = {}
        if preprocess_filters is not None:
            filtered_params, kwargs_to_use = preprocess_filters(**kwargs_to_use)

        for key, value in kwargs_to_use.items():
            if value is not None:
                filtered_params[key] = value

        return filtered_params

    params = []
    if inject_current_user:
        params.append(
            inspect.Parameter(
                "__calling_user",
                inspect.Parameter.POSITIONAL_OR_KEYWORD,
                default=Depends(get_speaker_user),
            )
        )

    for key, value in filter_config.filters.items():
        params.append(
            inspect.Parameter(
                key,
                inspect.Parameter.POSITIONAL_OR_KEYWORD,
                default=Query(value, alias=key),
            )
        )

    sig = inspect.Signature(params)
    setattr(filters, "__signature__", sig)

    return filters


def _apply_model_pk(**pkeys: dict[str, type]):
    """
    This decorator injects arguments into a fastCRUD endpoint.
    It dynamically changes the endpoint signature and allows to use
    multiple primary keys without defining them explicitly.
    """

    def wrapper(endpoint):
        signature = inspect.signature(endpoint)
        parameters = [p for p in signature.parameters.values() if p.kind == inspect.Parameter.POSITIONAL_OR_KEYWORD]
        extra_positional_params = [
            inspect.Parameter(name=k, annotation=v, kind=inspect.Parameter.KEYWORD_ONLY) for k, v in pkeys.items()
        ]

        endpoint.__signature__ = signature.replace(parameters=parameters + extra_positional_params)
        return endpoint

    return wrapper


def _extend_schema_to_select(model, schema_to_select, extra_columns):
    if extra_columns and schema_to_select:
        columns_to_select = {}
        for field in model.model_fields.keys():
            if field in extra_columns:
                columns_to_select[field] = (model.model_fields[field].annotation, ...)

        return create_model("ActualSelect", __base__=schema_to_select, **columns_to_select)

    return schema_to_select


def gen_get_single(
    crud: FastCRUD,
    get_async_session,
    schema_to_select=None,
    join_configs=[],
    item_id_field_name: str = "id",
    user_id_field_name: str = "user_id",
    only_admins_see_others: bool = True,
):
    @_apply_model_pk(**{item_id_field_name: str})
    async def endpoint(
        track_event: Tracker,
        calling_user: Annotated[User, Depends(get_speaker_user)],
        extra_columns: Annotated[list[str] | None, Query(alias="extraColumns")] = None,
        db: any = Depends(get_async_session),
        **pkeys,
    ):
        common_read_params = dict(
            db=db,
            schema_to_select=_extend_schema_to_select(crud.model, schema_to_select, extra_columns),
            one_or_none=False,
        )

        user_filter = dict()
        # Force filter on "owned items" if only admins can see other's owned items
        if user_id_field_name and only_admins_see_others and not calling_user.is_admin():
            user_filter[user_id_field_name] = calling_user.id

        getter = crud.get
        if join_configs:
            getter = crud.get_joined
            common_read_params["joins_config"] = join_configs
            common_read_params["nest_joins"] = True

        track_event(f"Get {crud.model.__name__} Item")
        return await getter(**common_read_params, **user_filter, **pkeys)

    return endpoint


def gen_get_multi(
    crud: FastCrudWithOrFilters,
    get_async_session,
    dynamic_filters,
    schema_to_select=None,
    join_configs=[],
):
    async def endpoint(
        track_event: Tracker,
        db: any = Depends(get_async_session),
        page: Optional[int] = Query(None, alias="page", description="Page number"),
        items_per_page: Optional[int] = Query(None, alias="itemsPerPage", description="Number of items per page"),
        sort_columns: Annotated[list[str] | None, Query(alias="sortColumns")] = None,
        sort_orders: Annotated[list[str] | None, Query(alias="sortOrders")] = None,
        extra_columns: Annotated[list[str] | None, Query(alias="extraColumns")] = None,
        filters: dict = Depends(dynamic_filters),
    ):
        common_read_params = dict(
            db=db,
            schema_to_select=_extend_schema_to_select(crud.model, schema_to_select, extra_columns),
            sort_columns=sort_columns,
            sort_orders=sort_orders,
        )

        track_event(f"Get {crud.model.__name__} Items")

        getter = crud.get_multi
        if join_configs:
            getter = crud.get_multi_joined
            common_read_params["joins_config"] = join_configs
            common_read_params["nest_joins"] = True

        if not (page and items_per_page):
            return await getter(
                **common_read_params,
                offset=0,
                limit=100,
                **filters,
            )

        offset = compute_offset(page=page, items_per_page=items_per_page)
        crud_data = await getter(**common_read_params, offset=offset, limit=items_per_page, **filters)

        return paginated_response(crud_data=crud_data, page=page, items_per_page=items_per_page)  # pragma: no cover

    return endpoint
