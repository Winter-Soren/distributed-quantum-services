ifeq ($(OS),Windows_NT)
BASH ?= C:/Program Files/Git/bin/bash.exe
else
BASH ?= bash
endif

.PHONY: install lint format test run run-clean clean help

# Install runtime and development dependencies via uv.
install:
	uv sync --extra dev

# Run static analysis (ruff + mypy) on source and tests.
lint:
	uv run ruff check src tests
	uv run mypy src

# Auto-format source and tests with ruff formatter.
format:
	uv run ruff format src tests

# Execute the test suite with pytest.
test:
	uv run pytest

# Run backend-v2 API with the standard local startup wrapper.
run:
	"$(BASH)" -lc "./scripts/demo-start.sh"

# Flush local runtime artifacts, then start backend-v2.
run-clean:
	"$(BASH)" -lc "./scripts/demo-start.sh --clean"

# Remove Python/build caches and local virtual environment.
clean:
	"$(BASH)" -lc "find . -type d -name __pycache__ -prune -exec rm -rf {} + && rm -rf .pytest_cache .mypy_cache .ruff_cache .coverage htmlcov .venv"

# Print available targets and quick usage notes.
help:
	@"$(BASH)" -lc "printf '%s\n' 'Usage: make <target>' 'Targets:' '  install    Install dependencies' '  lint       Run linting checks and type checking' '  format     Format code with ruff' '  test       Run tests with pytest' '  run        Start backend-v2 with the standard local startup wrapper' '  run-clean  Remove local peerstore and peer logs, then start backend-v2' '  clean      Clean the project'"
