import path from "path";

import { defineConfig } from "@tarojs/cli";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import devConfig from "./dev";
import prodConfig from "./prod";

/** Repo root when commands run from wechat-miniapp/ */
const repoRoot = path.resolve(process.cwd(), "..");

const sharedApiSrc = path.join(repoRoot, "packages/shared-api/src");

const resolveSharedPackages = (chain) => {
  chain.resolve.alias.set("@wardrowbe/shared-api", sharedApiSrc);
  chain.resolve.alias.set("@wardrowbe/shared-domain", path.join(repoRoot, "packages/shared-domain/src"));
};

export default defineConfig(async (merge, { command, mode }) => {
  const baseConfig = {
    projectName: "wardrowbe-wechat",
    date: "2026-4-22",
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: "src",
    outputRoot: "dist",
    plugins: [],
    defineConstants: {},
    copy: {
      patterns: [],
      options: {},
    },
    framework: "react",
    compiler: "webpack5",
    cache: {
      enable: false,
    },
    mini: {
      compile: {
        include: [(modulePath) => typeof modulePath === "string" && modulePath.includes(`${path.sep}packages${path.sep}shared-api`)],
      },
      postcss: {
        pxtransform: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: "module",
            generateScopedName: "[name]__[local]___[hash:base64:5]",
          },
        },
      },
      webpackChain(chain) {
        chain.resolve.plugin("tsconfig-paths").use(TsconfigPathsPlugin);
        resolveSharedPackages(chain);
      },
    },
    h5: {
      publicPath: "/",
      staticDirectory: "static",
      output: {
        filename: "js/[name].[hash:8].js",
        chunkFilename: "js/[name].[chunkhash:8].js",
      },
      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: "css/[name].[hash].css",
        chunkFilename: "css/[name].[chunkhash].css",
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: "module",
            generateScopedName: "[name]__[local]___[hash:base64:5]",
          },
        },
      },
      webpackChain(chain) {
        chain.resolve.plugin("tsconfig-paths").use(TsconfigPathsPlugin);
        resolveSharedPackages(chain);
      },
    },
    rn: {
      appName: "wardrowbeWechat",
      postcss: {
        cssModules: {
          enable: false,
        },
      },
    },
  };

  if (process.env.NODE_ENV === "development") {
    return merge({}, baseConfig, devConfig);
  }
  return merge({}, baseConfig, prodConfig);
});
