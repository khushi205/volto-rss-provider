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
    rss_feed: [
      { '@type': 'title', fixed: true, required: true, disableNewBlocks: true },
      {
        '@type': 'listing',
        fixed: true,
        required: true,
        disableNewBlocks: true,
      },
    ],
  };

  config.views.contentTypesViews.rss_feed = RSSFeedView;
  config.views.layoutViewsNamesMapping.rss_feed_view = 'Rss Feed';

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
