const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withFixedBottomBarKeyboard(config) {
  return withAndroidManifest(config, (config) => {
    const activities = config.modResults.manifest.application?.[0]?.activity ?? [];
    const mainActivity = activities.find(({ $ }) => $['android:name']?.endsWith('.MainActivity'));

    if (!mainActivity) {
      throw new Error('Could not find the Android MainActivity to configure keyboard resizing.');
    }

    const currentMode = mainActivity.$['android:windowSoftInputMode'] ?? '';
    const preservedFlags = currentMode
      .split('|')
      .filter((flag) => flag && !flag.startsWith('adjust'));
    mainActivity.$['android:windowSoftInputMode'] = [...preservedFlags, 'adjustNothing'].join('|');

    return config;
  });
};
