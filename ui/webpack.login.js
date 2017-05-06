const path = require('path'),
  webpack = require('webpack'),
  LiveReloadPlugin = require('webpack-livereload-plugin'),
  ExtractTextPlugin = require("extract-text-webpack-plugin");
if(process.argv.indexOf('-p') !== -1) {
  process.env.NODE_ENV = 'production';
}

/** MODULE ENTRIES
 * For each new module, add it here.
 * */
const entries = [
  path.normalize(__dirname + '/src/login')
];

const CONFIG = {
  "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  NODE_ENV: JSON.stringify(process.env.NODE_ENV)
};

module.exports = {
  entry: entries,
  output: {
    path: path.normalize(__dirname + '/../public'),
    publicPath: '/',
    library: "login",
    filename: "js/login.js"
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader")
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin(CONFIG),
    new webpack.optimize.OccurenceOrderPlugin(),
    new ExtractTextPlugin("css/login.css")
  ],
  resolve: {
    alias: {
      "React": "react",
      "react": "react",
      "config": path.normalize(__dirname + "/src/lib/config"),
      "api": path.normalize(__dirname + "/src/lib/api")
    },
    root: [
      path.normalize(__dirname + '/../node_modules'),
      path.normalize(__dirname + '/src/lib'),
      path.normalize(__dirname + '/src/modules')
    ],
    modulesDirectories: ['node_modules', 'src'],
    extensions: ['', '.js', '.jsx']
  },
  // Place your external dependencies here (momentjs, etc)
  externals: {}
};

if (process.env.NODE_ENV === 'production') {
  module.exports.plugins.push(new webpack.optimize.UglifyJsPlugin({
    sourceMap: false,
    compress: {warnings: false},
    comments: false
  }));
  module.exports.plugins.push(new webpack.BannerPlugin('Copyright 2017 UNLOQ Systems LTD'));
} else {
  /* Live-reload configuration */
  module.exports.plugins.push(new LiveReloadPlugin({
    port: 18010
  }));
}
