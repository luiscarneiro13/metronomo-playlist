const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = {
  expo: {
    name: IS_DEV ? '(Dev) Metronomo Playlist' : 'Metronomo Playlist',
    slug: 'metronomo-playlist',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'metronomoplaylist',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    icon: './assets/icon.png',
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV
        ? 'com.metronomoplaylist.dev'
        : 'com.metronomoplaylist',
    },
    android: {
      package: IS_DEV
        ? 'com.metronomoplaylist.dev'
        : 'com.metronomoplaylist',
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#131313',
      },
    },
    web: {},
    plugins: [
      'expo-font',
      'expo-secure-store',
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#131313',
        },
      ],
    ],
  },
};
