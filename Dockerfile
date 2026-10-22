# ==============================================================================
# Telegram University Auto-Publisher V3.0 (Production Dockerfile)
# Optimized for Railway, Render, Fly.io, and VPS deployments
# ==============================================================================

FROM python:3.11-slim

# منع تخزين البايت كود وضمان ظهور المخرجات فورياً في سجلات الاستضافة
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8088

WORKDIR /app

# تثبيت متطلبات النظام الأساسية للتجميع والتشفير
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# تثبيت حزم بايثون
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# نسخ ملفات المشروع
COPY . .

# إنشاء مجلد البيانات لضمان استمرارية قاعدة البيانات
RUN mkdir -p /app/data

# المنفذ الخاص بفحص الصحة Keep-Alive
EXPOSE 8088 3000

# فحص صحة الحاوية التلقائي
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8088}/ || exit 1

# تشغيل البوت الأساسي
CMD ["python3", "main.py"]
