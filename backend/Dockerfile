FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libgmp-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/backend

COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev --no-install-project

COPY src ./src
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
COPY Makefile README.md pyproject.toml ./
COPY config ./config
COPY scripts ./scripts
COPY src ./src

RUN mkdir -p /workspace/backend/data

EXPOSE 8080

CMD ["make", "demo-clean-docker"]
