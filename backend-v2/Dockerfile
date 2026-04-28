FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libgmp-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/backend-v2

COPY backend-v2/pyproject.toml backend-v2/uv.lock backend-v2/README.md ./
RUN uv sync --frozen --no-dev --no-install-project

COPY backend-v2/alembic ./alembic
COPY backend-v2/alembic.ini ./alembic.ini
COPY backend-v2/scripts ./scripts
COPY backend-v2/src ./src
RUN uv sync --frozen --no-dev


FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS runner

RUN apt-get update \
    && apt-get install -y --no-install-recommends bash libgmp10 lsof make \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/workspace/backend-v2/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /workspace/backend-v2

COPY --from=builder /workspace/backend-v2/.venv ./.venv
COPY backend-v2/Makefile backend-v2/README.md backend-v2/pyproject.toml backend-v2/alembic.ini ./
COPY backend-v2/alembic ./alembic
COPY backend-v2/scripts ./scripts
COPY backend-v2/src ./src

RUN mkdir -p /workspace/backend-v2/quantum-backend-v2/peer-logs \
    /workspace/backend-v2/quantum-backend-v2/libp2p

EXPOSE 8080

CMD ["quantum-backend-v2", "--host", "0.0.0.0", "--port", "8080"]
