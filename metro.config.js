// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add extensions needed for face-api models and HTML
config.resolver.assetExts.push(
  'html',    // for face-verification.html
  'json',    // for *-weights_manifest.json
  'shard1',  // legacy
  'bin'      // for model weight files (.bin)
);

module.exports = config;