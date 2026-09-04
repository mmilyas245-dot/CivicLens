# ============================================================
# CivicLens Backend — Hugging Face Docker Space
# ============================================================

FROM python:3.11-slim

# Hugging Face recommends running as user ID 1000
RUN useradd -m -u 1000 user

USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Copy dependencies first
COPY --chown=user requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy CivicLens backend
COPY --chown=user . .

# Hugging Face Docker Spaces use port 7860
EXPOSE 7860

# Start Flask using Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "app:app"]