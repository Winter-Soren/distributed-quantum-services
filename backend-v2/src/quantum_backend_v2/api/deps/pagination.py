"""Pagination dependency for list endpoints."""

from __future__ import annotations

from typing import Annotated, Any, Generic, TypeVar

from fastapi import Depends, Query
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Standard pagination query parameters for list endpoints."""

    model_config = ConfigDict(extra="forbid")

    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=200)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


async def _pagination_params(
    page: int = Query(default=1, ge=1, description="1-indexed page number."),
    page_size: int = Query(default=20, ge=1, le=200, description="Items per page."),
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)


PageParams = Annotated[PaginationParams, Depends(_pagination_params)]


class PagedResponse(BaseModel, Generic[T]):
    """Generic paginated response envelope."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    items: list[Any]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    pages: int = Field(ge=0)

    @classmethod
    def of(
        cls,
        items: list[Any],
        *,
        total: int,
        params: PaginationParams,
    ) -> "PagedResponse[Any]":
        pages = max(1, -(-total // params.page_size))
        return cls(
            items=items,
            total=total,
            page=params.page,
            page_size=params.page_size,
            pages=pages,
        )
