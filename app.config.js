const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = {
  expo: {
    name: IS_DEV ? 'Playlist Metronome (Dev)' : 'Playlist Metronome',
    slug: 'playlist-metronome',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'playlistmetronome',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV
        ? 'com.tryironflow.playlistmetronome.dev'
        : 'com.tryironflow.playlistmetronome',
    },
    android: {
      package: IS_DEV
        ? 'com.tryironflow.playlistmetronome.dev'
        : 'com.tryironflow.playlistmetronome',
      edgeToEdgeEnabled: true,
    },
    web: {},
  },
};
