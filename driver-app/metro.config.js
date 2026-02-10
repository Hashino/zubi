const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Watch the shared folder
config.watchFolders = [
  path.resolve(__dirname, '../shared')
];

// Support resolving modules from shared
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../shared/node_modules')
];

module.exports = config;
