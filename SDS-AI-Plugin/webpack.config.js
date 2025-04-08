/* eslint-disable no-undef */

const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const fs = require("fs");
const webpack = require("webpack");

const versionFilePath = path.resolve(__dirname, "src", "version.json");
const version = JSON.parse(fs.readFileSync(versionFilePath, "utf8")).version;

const appSettingsPath = path.resolve(__dirname, "appsettings.json");
const appSettings = JSON.parse(fs.readFileSync(appSettingsPath, "utf8"));

module.exports = (env, options) => {
  const mode = options.mode || "production"; // Default to production mode
  const isTest = env && env.test; // Check if the test environment is set
  const isDev = mode === "development";

  console.log(`Building for mode: ${mode}, Test environment: ${isTest}`);

  // Dynamically select the correct appsettings block
  const selectedAppSettings = isTest
    ? appSettings.test
    : mode === "production"
    ? appSettings.production
    : appSettings.development;

  return {
    mode,
    devtool: isDev ? "source-map" : false,
    entry: {
      polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
      react: ["react", "react-dom"],
      taskpane: {
        import: ["./src/taskpane/index.tsx", "./src/taskpane/taskpane.html"],
        dependOn: "react",
      },
      commands: "./src/commands/commands.ts",
      dialog: "./src/taskpane/components/dialog.tsx", // Updated this line
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      publicPath: isTest
        ? "/SDS-AI-Outlook-Plugin/" // Use a different public path for test
        : "",
      filename: "[name].js",
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".html"], // Add .jsx to extensions
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: ["ts-loader"],
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: "html-loader",
        },
        {
          test: /\.(png|jpg|jpeg|ttf|woff|woff2|gif|ico|svg)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext][query]",
          },
        },
        {
          test: /\.(js|jsx)$/,
          include: [
            path.resolve(__dirname, "src"),
            path.resolve(__dirname, "tools") // Include the tools folder
          ],
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"],
            },
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"], // Loaders for CSS files
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/taskpane/taskpane.html",
        chunks: ["polyfill", "taskpane", "react"],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets",
            to: "assets",
          },
          {
            from: "tools",
            to: "tools",
          },{
           from: "src/pdf.worker.min.mjs",
           to: "src/pdf.worker.min.mjs"
          }
        ],
      }),
     
      new HtmlWebpackPlugin({
        filename: "commands.html",
        template: "./src/commands/commands.html",
        chunks: ["polyfill", "commands"],
      }),
      new webpack.DefinePlugin({
        APP_VERSION: JSON.stringify(version), // Inject the version into the app
        APP_SETTINGS: JSON.stringify(selectedAppSettings), // Inject the selected appsettings block
      }),
    ],
  };
};
