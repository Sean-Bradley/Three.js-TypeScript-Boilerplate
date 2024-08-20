const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const path = require('path')

module.exports = merge(common, {
    mode: 'development',
    devtool: 'eval-source-map',
    devServer: {
        static: {
            directory: path.join(__dirname, '../../dist/client'),
        },
        hot: true,
        proxy: [
            {
                context: ['/socket.io'],
                target: 'http://localhost:3000',
                ws: true,
            },
        ],
    },
})
