#!/bin/bash

# Script para fazer build local e publicar no Google Play
# Uso: ./build-and-submit.sh [passenger|driver]

set -e

APP_TYPE=$1

if [ "$APP_TYPE" != "passenger" ] && [ "$APP_TYPE" != "driver" ]; then
    echo "❌ Uso: ./build-and-submit.sh [passenger|driver]"
    exit 1
fi

APP_DIR="${APP_TYPE}-app"
APP_NAME=$([ "$APP_TYPE" = "passenger" ] && echo "Passageiro" || echo "Motorista")

echo ""
echo "🚀 Build e Publicação - Zubi ${APP_NAME}"
echo "========================================"
echo ""

# 1. Incrementar versão
echo "📦 Incrementando versão..."
node scripts/increment-version.js $APP_TYPE
echo ""

# 2. Fazer build local
echo "🔨 Iniciando build local..."
cd $APP_DIR

# Fazer prebuild se necessário (gera pasta android/)
if [ ! -d "android" ]; then
    echo "📱 Gerando projeto Android..."
    npx expo prebuild --platform android
fi

# Build local
echo "🏗️  Compilando app bundle..."
npx eas build --platform android --profile production-local --local

# Encontrar o .aab gerado
AAB_FILE=$(find . -name "*.aab" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)

if [ -z "$AAB_FILE" ]; then
    echo "❌ Erro: Arquivo .aab não encontrado"
    exit 1
fi

echo ""
echo "✅ Build concluído: $AAB_FILE"
echo ""

# 3. Publicar no Google Play
echo "📤 Publicando no Google Play..."
npx eas submit --platform android --path "$AAB_FILE" --profile production

echo ""
echo "🎉 Sucesso! App publicado como rascunho no Google Play Console"
echo ""
