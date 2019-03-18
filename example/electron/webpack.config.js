const path = require("path");
const HtmlWebPackPlugin = require("html-webpack-plugin");

const htmlPlugin = new HtmlWebPackPlugin({
  template: "./src/index.html",
  filename: "./index.html"
});

module.exports = [
  {
    target: 'electron-main',
    entry:'./src/electron.js',
    mode: "development",
    output: {
      path: path.join(__dirname, 'dist/electron'),
      filename: 'electron.js',
    },  
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: ["source-map-loader", "babel-loader"]
        },
      ]
    },
  node: {
    __dirname: false,
    __filename: false,
  },
},
{
  target: 'electron-renderer',
  entry: "./src/index.jsx",
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist/electron"),
    filename: "bundle.js"
  },
  devServer: {
    contentBase: path.join(__dirname, "dist/electron"),
    compress: true,
    port: 9000
  },
  devtool: "source-map",
  resolve: {
    extensions: [".go", ".jsx", ".js", ".json"]
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ["source-map-loader", "babel-loader"]
      },
      {
        test: /\.go/,
        use: [
          {
            loader: path.join(__dirname, "..", "..", "dist", "index.js")
          }
        ]
      },
      {
        test: /\.css$/,
        loader: ["style-loader", "css-loader"]
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  },
  node: {
    __dirname: false,
    __filename: false,
    fs: "empty"
  },
  plugins: [htmlPlugin]
}];
