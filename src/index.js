const applyConfig = (config) => {
  config.settings = {
    ...config.settings,
    isMultilingual: false,
    supportedLanguages: ['en'],
    defaultLanguage: 'en',
  };

  config.blocks.initialBlocks = {
    ...config.blocks.initialBlocks,
    rss_feed: ['title', 'listing'],
  };

  return config;
};

export default applyConfig;
