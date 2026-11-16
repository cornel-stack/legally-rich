import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setConcurrency(null); // auto: one per core
Config.setChromiumOpenGlRenderer("angle");
Config.overrideWebpackConfig((config) => {
  return {
    ...config,
    resolve: {
      ...config.resolve,
      extensions: [...(config.resolve?.extensions ?? []), ".ts", ".tsx"],
    },
  };
});
