const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure we handle Reanimated's source files correctly
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx', 'js', 'jsx', 'json'];
config.resolver.resolverMainFields = ['main', 'react-native', 'browser'];

module.exports = config;
