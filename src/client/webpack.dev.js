const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'eval-source-map',
    devServer: {
        contentBase: './dist/client',
        hot: true,
        proxy: {
            "/socket.io": {
                target: "http://127.0.0.1:3000",
                ws: true
            }
        }
    }
});