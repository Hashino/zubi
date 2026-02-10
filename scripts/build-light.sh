#!/bin/bash

# Build script com recursos limitados para não travar o sistema
# Uso: ./build-light.sh [passenger|driver|both]

set -e

export JAVA_HOME=~/.local/jdk/jdk-17.0.2
export ANDROID_HOME=~/Android/Sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

# Limita recursos para não travar
export GRADLE_OPTS="-Xmx512m -XX:MaxMetaspaceSize=256m"

APP=$1

echo "🚀 Zubi Build Light - Recursos Limitados"
echo "========================================"

build_app() {
    local app_name=$1
    local app_dir=$2
    
    echo ""
    echo "📦 Building $app_name..."
    echo "------------------------"
    
    cd "$app_dir/android"
    
    # Build com recursos limitados
    ./gradlew assembleRelease \
        --no-daemon \
        --max-workers=1 \
        --parallel \
        --configure-on-demand \
        --build-cache \
        2>&1 | tee "/tmp/${app_name}-build.log"
    
    if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
        echo "✅ $app_name build successful!"
        
        # Copia APK
        mkdir -p ~/zubi-builds-new
        cp app/build/outputs/apk/release/app-release.apk \
           ~/zubi-builds-new/zubi-${app_name}-app.apk
        
        ls -lh ~/zubi-builds-new/zubi-${app_name}-app.apk
    else
        echo "❌ $app_name build failed!"
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
echo "🎉 Build completo!"
echo "APKs disponíveis em: ~/zubi-builds-new/"
ls -lh ~/zubi-builds-new/
