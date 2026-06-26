// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';
process.env.ASSET_PATH = '/';

var WebpackDevServer = require('webpack-dev-server'),
  webpack = require('webpack'),
  config = require('../webpack.config'),
  env = require('./env'),
  path = require('path');

// 1. DYNAMIC TARGET BROWSER DETECT
const TARGET_BROWSER = process.env.TARGET_BROWSER || 'chrome';

// Extract the options safely regardless of where they are nested
var options = config.chromeExtensionBoilerplate || {};
// Fallback check if you already moved it to LoaderOptionsPlugin in webpack.config
if (!options.notHotReload && config.plugins) {
  const loaderPlugin = config.plugins.find(p => p instanceof webpack.LoaderOptionsPlugin);
  if (loaderPlugin && loaderPlugin.options && loaderPlugin.options.options) {
    options = loaderPlugin.options.options.chromeExtensionBoilerplate || {};
  }
}
var excludeEntriesToHotReload = options.notHotReload || [];

for (var entryName in config.entry) {
  if (excludeEntriesToHotReload.indexOf(entryName) === -1) {
    config.entry[entryName] = [
      'webpack/hot/dev-server',
      `webpack-dev-server/client?hot=true&hostname=localhost&port=${env.PORT}`,
    ].concat(config.entry[entryName]);
  }
}

// Clean up the object property so Webpack doesn't throw a schema error
if (config.chromeExtensionBoilerplate) {
  delete config.chromeExtensionBoilerplate;
}

var compiler = webpack(config);

var server = new WebpackDevServer(
  {
    https: false,
    hot: true,
    liveReload: false,
    client: {
      webSocketTransport: 'ws',
    },
    webSocketServer: 'ws',
    host: 'localhost',
    port: env.PORT,
    static: {
      // 2. FIXED: Serve static files from the browser-specific directory
      directory: path.join(__dirname, `../dist/${TARGET_BROWSER}`),
    },
    devMiddleware: {
      publicPath: `http://localhost:${env.PORT}/`,
      writeToDisk: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    allowedHosts: 'all',
  },
  compiler
);

(async () => {
  await server.start();
})();
