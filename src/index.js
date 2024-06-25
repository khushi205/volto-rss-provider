import RSSFeedView from './components/RSSFeedView';

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

  config.views.contentTypesViews.rss_feed = RSSFeedView;

  if (__SERVER__) {
    const makeMiddlewares = require('./express-middleware').default;

    config.settings.expressMiddleware = [
      ...config.settings.expressMiddleware,
      makeMiddlewares(config),
    ];
  }
  return config;
};

export default applyConfig;
