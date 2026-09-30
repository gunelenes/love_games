// Learn more https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Block the `admin/` sub-project so Metro/Expo never treats it as another
// Expo app. Admin is a standalone Next.js project (deployed separately to
// Railway) and lives in the same repo purely for convenience.
const blockedAdmin = new RegExp(
  path
    .join(projectRoot, 'admin')
    .replace(/\\/g, '\\\\')
    .replace(/\//g, '\\/') + '.*'
);

const existingBlockList = config.resolver.blockList;
config.resolver.blockList = existingBlockList
  ? Array.isArray(existingBlockList)
    ? [...existingBlockList, blockedAdmin]
    : [existingBlockList, blockedAdmin]
  : [blockedAdmin];

// Ensure Metro only watches the mobile project root, not admin/.
config.watchFolders = [projectRoot];

module.exports = config;
