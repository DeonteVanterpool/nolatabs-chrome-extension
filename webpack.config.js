var webpack = require('webpack'),
    path = require('path'),
    fileSystem = require('fs-extra'),
    env = require('./utils/env'),
    CopyWebpackPlugin = require('copy-webpack-plugin'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    TerserPlugin = require('terser-webpack-plugin');
var {CleanWebpackPlugin} = require('clean-webpack-plugin');

const ASSET_PATH = process.env.ASSET_PATH || '/';

var alias = {
    'src': path.resolve(__dirname, 'src'),
};

// load the secrets
var secretsPath = path.join(__dirname, 'secrets.' + env.NODE_ENV + '.js');

var fileExtensions = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'eot',
    'otf',
    // 'svg',
    'ttf',
    'woff',
    'woff2',
];

if (fileSystem.existsSync(secretsPath)) {
    alias['secrets'] = secretsPath;
}

const TARGET_BROWSER = process.env.TARGET_BROWSER || 'chrome';
const isDevelopment = process.env.NODE_ENV !== 'production';
const buildPath = path.resolve(__dirname, `dist/${TARGET_BROWSER}`);

var options = {
    mode: process.env.NODE_ENV || 'development',
    experiments: {
        asyncWebAssembly: true,
        layers: true,
    },
    entry: {
        options: path.join(__dirname, 'src', 'entries', 'options', 'index.jsx'),
        background: path.join(__dirname, 'src', 'entries', 'background', 'index.ts'),
        frontend: path.join(__dirname, 'src', 'entries', 'frontend', 'index.tsx'),
    },
    output: {
        filename: '[name].bundle.js',
        path: buildPath,
        clean: true,
        publicPath: ASSET_PATH,
    },
    devServer: {
        hot: false,
        liveReload: false,
        client: {
            overlay: {
                errors: true,   // Show overlay for errors
                warnings: false, // Hide overlay for warnings
                runtimeErrors: true, // Show overlay for runtime errors
            },
        },
    },
    module: {
        rules: [
            {
                // look for .css or .scss files
                test: /\.(css|scss)$/,
                // in the `src` directory
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            api: "modern",
                            sourceMap: true,
                        },
                    },
                ],
            },
            {
                test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
                type: 'asset/resource',
                exclude: /node_modules/,
                // loader: 'file-loader',
                // options: {
                //   name: '[name].[ext]',
                // },
            },
            {
                test: /\.html$/,
                loader: 'html-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: require.resolve('ts-loader'),
                        options: {
                            getCustomTransformers: () => ({
                                before: [].filter(
                                    Boolean
                                ),
                            }),
                            transpileOnly: isDevelopment,
                        },
                    },
                ],
            },
            {
                test: /\.(js|jsx)$/,
                use: [
                    {
                        loader: 'source-map-loader',
                    },
                    {
                        loader: require.resolve('babel-loader'),
                        options: {
                            plugins: [
                                isDevelopment && require.resolve('react-refresh/babel'),
                            ].filter(Boolean),
                        },
                    },
                ],
                exclude: /node_modules/,
            },
            {
                test: /\.wasm$/,
                type: 'webassembly/async',
            },
            {
                test: /\.svg$/i,
                issuer: /\.[jt]sx?$/,
                use: ['@svgr/webpack'],
            },
        ],
    },
    resolve: {
        // We're using different node.js modules in our code,
        // this prevents WebPack from failing on them or embedding
        // polyfills for them into the bundle.
        //
        // Error: Module not found: Error: Can't resolve 'fs'
        fallback: {
            path: false,
            fs: false,
            Buffer: false,
            process: false,
        },
        alias: alias,
        extensions: fileExtensions
            .map((extension) => '.' + extension)
            .concat(['.js', '.jsx', '.ts', '.tsx', '.css']),
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({
            options: {
                chromeExtensionBoilerplate: {
                    notHotReload: ['background', 'contentScript', 'devtools'],
                }
            }
        }),
        new CleanWebpackPlugin({verbose: false}),
        new webpack.ProgressPlugin(),
        // expose and write the allowed env vars on the compiled bundle
        new webpack.EnvironmentPlugin(['NODE_ENV']),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'src/wasm/crypto/pkg/crypto_bg.wasm',
                    to: 'crypto_bg.wasm',
                    force: true,
                },
            ],
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'src/assets/img/icon-128.png',
                    to: 'icon-128.png',
                    force: true,
                },
            ],
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'src/assets/img/logo.svg',
                    to: 'logo.svg',
                    force: true,
                },
            ],
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'src/assets/img/icon-34.png',
                    to: 'icon-34.png',
                    force: true,
                },
            ],
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'src', 'entries', 'options', 'index.html'),
            filename: 'options.html',
            chunks: ['options'],
            cache: false,
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'src', 'entries', 'frontend', 'index.html'),
            filename: 'frontend.html',
            chunks: ['frontend'],
            cache: false,
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: './src/manifest.json',
                    to: 'manifest.json',
                    transform(content) {
                        // Parse the original manifest
                        const manifest = JSON.parse(content.toString());

                        if (TARGET_BROWSER === 'firefox') {
                            // Firefox requires browser_specific_settings for MV3
                            manifest.browser_specific_settings = {
                                gecko: {
                                    id: "deonte@asimslaboratory.com", // Choose a unique ID string
                                    strict_min_version: "121.0" // Ensures fallback behavior works safely
                                }
                            };
                        }
                        manifest.description = process.env.npm_package_description;
                        manifest.version = process.env.npm_package_version;

                        // Return the modified manifest as a buffer
                        return JSON.stringify(manifest, null, 2);
                    },
                },
                // Copy your HTML/Images if you have them
                {from: './src/popup.html', to: 'popup.html', noErrorOnMissing: true},
                {from: './src/icons', to: 'icons', noErrorOnMissing: true},
            ],
        }),
    ].filter(Boolean),
    infrastructureLogging: {
        level: 'info',
    },
    ignoreWarnings: [
        // (warning) => warning.message.includes('Deprecation The legacy JS API is deprecated and will be removed in Dart Sass 2.0.0.'),
    ],
};

if (env.NODE_ENV === 'development') {
    options.devtool = 'cheap-module-source-map';
} else {
    options.optimization = {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
            }),
        ],
    };
}

module.exports = options;
