const appJson = require("./app.json");

const googleMapsApiKey = process.env.EXPO_PUBLIC_MAP_API_KEY;

module.exports = {
  expo: {
    ...appJson.expo,
    ios: {
      ...appJson.expo.ios,
      config: {
        ...appJson.expo.ios?.config,
        googleMapsApiKey,
      },
    },
    android: {
      ...appJson.expo.android,
      config: {
        ...appJson.expo.android?.config,
        googleMaps: {
          ...appJson.expo.android?.config?.googleMaps,
          apiKey: googleMapsApiKey,
        },
      },
    },
    extra: {
      eas: {
        projectId: "86813805-d0f5-4455-915e-2269b66fce9d"
      }
    }
  }
};
