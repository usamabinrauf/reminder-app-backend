const path = require('path');

module.exports = function override(config, env) {
    // Add fallbacks for missing core modules
    config.resolve.fallback = {
        fs: false,
        path: require.resolve('path-browserify'),
    };

    return config;
};
