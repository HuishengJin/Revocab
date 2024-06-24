import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        background: './src/background.js',
        popup: './src/popup/popup.js',
        content: './src/content.js',
        options: './src/options/options.js',
        active_vocab_management: './src/active_vocab_manage/active_vocab_management.js',
        synonym_management: './src/active_vocab_manage/synonym_management.js'
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/popup/popup.html',
            filename: 'popup.html',
            chunks: ['popup']
        }),
        new HtmlWebpackPlugin({
            template: './src/options/options.html',
            filename: 'options.html',
            chunks: ['options']
        }),
        new HtmlWebpackPlugin({
            template: './src/active_vocab_manage/active_vocab_management.html',
            filename: 'active_vocab_management.html',
            chunks: ['active_vocab_management']
        }),
        new HtmlWebpackPlugin({
            template: './src/active_vocab_manage/synonym_management.html',
            filename: 'synonym_management.html',
            chunks: ['synonym_management']
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: "src/manifest.json",
                    to: "manifest.json"
                },
                {
                    from: "src/images/icon48.png",
                    to: "images/icon48.png"
                },
                {
                    from: "src/popup/popup.css",
                    to: "popup.css"
                },
                {
                    from: "src/active_vocab_manage/active_vocab_management.css",
                    to: "active_vocab_management.css"
                },
	        {
                    from: "src/active_vocab_manage/synonym_management.css",
                    to: "synonym_management.css"
                },
                {
                    from: "src/options/options.css",
                    to: "options.css"
                },
                {
                    from: "src/utils",
                    to: "utils"
                }
	        /*{
		    from: "models",
		    to: "models"
		}*/
            ],
        })
    ],
    resolve: {
        extensions: ['.js', '.json'],
    },
};

export default config;
