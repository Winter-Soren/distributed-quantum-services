FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libgmp-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/backend

COPY backend/pyproject.toml backend/uv.lock backend/README.md ./
RUN uv sync --frozen --no-dev --no-install-project

COPY backend/alembic ./alembic
COPY backend/alembic.ini ./alembic.ini
COPY backend/scripts ./scripts
COPY backend/src ./src
RUN uv sync --frozen --no-dev


FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS runner

RUN apt-get update \
    && apt-get install -y --no-install-recommends bash libgmp10 lsof make \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/workspace/backend/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /workspace/backend

COPY --from=builder /workspace/backend/.venv ./.venv
COPY backend/Makefile backend/README.md backend/pyproject.toml backend/alembic.ini ./
COPY backend/alembic ./alembic
COPY backend/scripts ./scripts
COPY backend/src ./src

RUN mkdir -p /workspace/backend/quantum-backend/peer-logs \
    /workspace/backend/quantum-backend/libp2p

EXPOSE 8080

CMD ["quantum-backend", "--host", "0.0.0.0", "--port", "8080"]
