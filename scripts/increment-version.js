#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function incrementVersion(appPath) {
  const appJsonPath = path.join(appPath, 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  const currentVersion = appJson.expo.version;
  const versionParts = currentVersion.split('.');
  versionParts[2] = parseInt(versionParts[2]) + 1;
  const newVersion = versionParts.join('.');
  
  appJson.expo.version = newVersion;
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
  
  console.log(`✓ Versão incrementada: ${currentVersion} → ${newVersion}`);
  return newVersion;
}

function incrementVersionCode(appPath) {
  const gradlePath = path.join(appPath, 'android/app/build.gradle');
  
  if (!fs.existsSync(gradlePath)) {
    console.log('⚠ build.gradle não encontrado ainda (será gerado no prebuild)');
    return null;
  }
  
  let gradleContent = fs.readFileSync(gradlePath, 'utf8');
  const versionCodeMatch = gradleContent.match(/versionCode\s+(\d+)/);
  
  if (versionCodeMatch) {
    const currentVersionCode = parseInt(versionCodeMatch[1]);
    const newVersionCode = currentVersionCode + 1;
    gradleContent = gradleContent.replace(
      /versionCode\s+\d+/,
      `versionCode ${newVersionCode}`
    );
    fs.writeFileSync(gradlePath, gradleContent);
    console.log(`✓ versionCode incrementado: ${currentVersionCode} → ${newVersionCode}`);
    return newVersionCode;
  }
  
  return null;
}

const appName = process.argv[2];
if (!appName || !['passenger', 'driver'].includes(appName)) {
  console.error('Uso: node increment-version.js [passenger|driver]');
  process.exit(1);
}

const appPath = path.join(__dirname, '..', `${appName}-app`);
console.log(`\n🔄 Incrementando versão do ${appName} app...\n`);

const newVersion = incrementVersion(appPath);
incrementVersionCode(appPath);

console.log('\n✅ Pronto!\n');
