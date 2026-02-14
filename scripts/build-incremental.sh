#!/bin/bash

# Build incremental - Não limpa JS cache, muito mais rápido!
# Uso: ./build-incremental.sh [passenger|driver|both]

set -e

export JAVA_HOME=~/.local/jdk/jdk-17.0.2
export ANDROID_HOME=~/Android/Sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

# Limita recursos
export GRADLE_OPTS="-Xmx512m -XX:MaxMetaspaceSize=256m"

APP=$1

echo "⚡ Zubi Incremental Build - Super Rápido!"
echo "========================================="
echo "✓ Mantém JS cache existente"
echo "✓ Apenas recompila código alterado"
echo ""

build_app() {
    local app_name=$1
    local app_dir=$2
    
    echo "📦 Building $app_name (incremental)..."
    echo "------------------------"
    
    cd "$app_dir/android"
    
    # Build incremental - NÃO limpa bundle
    ./gradlew assembleRelease \
        --no-daemon \
        --max-workers=1 \
        --parallel \
        --configure-on-demand \
        --build-cache \
        2>&1 | tee "/tmp/${app_name}-build.log"
    
    if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
        echo "✅ $app_name build OK!"
        
        mkdir -p ~/zubi-builds
        cp app/build/outputs/apk/release/app-release.apk \
           ~/zubi-builds/zubi-${app_name}-app.apk
        
        echo "APK: ~/zubi-builds/zubi-${app_name}-app.apk"
        ls -lh ~/zubi-builds/zubi-${app_name}-app.apk
    else
        echo "❌ Build failed!"
        tail -50 "/tmp/${app_name}-build.log"
        exit 1
    fi
    
    cd ../../..
}

if [ "$APP" == "passenger" ] || [ "$APP" == "both" ] || [ -z "$APP" ]; then
    build_app "passenger" "passenger-app"
fi

if [ "$APP" == "driver" ] || [ "$APP" == "both" ]; then
    build_app "driver" "driver-app"
fi

echo ""
echo "🎉 Build incremental completo!"
echo "APKs em: ~/zubi-builds/"
