const path = require("path");
const webpack = require("webpack");
const createExpoWebpackConfigAsync = require("@expo/webpack-config");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  const appRoot = path.resolve(__dirname, "app").replace(/\\/g, "/");

  config.plugins = config.plugins || [];

  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    "expo-router/_ctx": path.resolve(__dirname, "expo-router-ctx.web.js"),
  };
  config.resolve.modules = [
    path.resolve(__dirname),
    "node_modules",
    ...(config.resolve.modules || []),
  ];

  for (const plugin of config.plugins) {
    if (plugin && plugin.definitions) {
      if (plugin.definitions["process.env"]) {
        plugin.definitions["process.env"].EXPO_ROUTER_APP_ROOT =
          JSON.stringify(appRoot);
      }
      if (plugin.definitions["process.env.EXPO_ROUTER_APP_ROOT"]) {
        plugin.definitions["process.env.EXPO_ROUTER_APP_ROOT"] =
          JSON.stringify(appRoot);
      }
    }
  }

  config.plugins.push(
    new webpack.DefinePlugin({
      "process.env.EXPO_ROUTER_APP_ROOT": JSON.stringify(appRoot),
      __EXPO_ROUTER_APP_ROOT__: JSON.stringify(appRoot),
    })
  );

  return config;
};
