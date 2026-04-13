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


FROM python:3.11-slim-bookworm AS runner

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgmp10 \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/workspace/backend/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /workspace/backend

COPY --from=builder /workspace/backend/.venv ./.venv
COPY README.md pyproject.toml ./
COPY config ./config
COPY src ./src

RUN mkdir -p /var/lib/quantum-coordinator

EXPOSE 8080

CMD ["uvicorn", "quantum_coordinator.asgi:app", "--host", "0.0.0.0", "--port", "8080"]
