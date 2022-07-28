module.exports = function override(config) {
  // disable manifest
  config.plugins = config.plugins.filter(
    plugin => plugin?.options?.fileName !== 'asset-manifest.json'
  );

  // add loaders
  config.module.rules[0].oneOf.splice(
    1,
    0,
    {
      test: /\.(md)$/i,
      loader: 'raw-loader',
    },
    {
      test: /\.(ttf)$/i,
      type: 'asset',
    },
  );

  return config;
};