const path = require("path");

module.exports = {
  stories: ["../src/components/**/stories.tsx"],
  addons: ["@storybook/addon-actions", "@storybook/addon-links", "@storybook/addon-a11y", "@storybook/addon-viewport/register"],
  webpackFinal: async config => {
    config.entry.unshift("./src/global.css");

    config.resolve.extensions = config.resolve.extensions.concat([
      ".ts",
      ".tsx"
    ]);

    config.module.rules = [
      {
        test: /(\.js|\.jsx|\.ts|\.tsx)$/,
        exclude: /node_modules/,
        use: "babel-loader"
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader",
            options: {
              import: true,
              importLoaders: 1,
              modules: true
            }
          },
          {
            loader: "postcss-loader"
          }
        ]
      },
      {
        test: /\.(eot|woff|woff2|ttf|svg)$/,
        use: [
          {
            loader: "file-loader",
            query: {
              outputPath: "fonts/"
            }
          }
        ]
      }
    ];

    return config;
  }
};
