import express from 'express';
import superagent from 'superagent';
import { Feed } from 'feed';
import { findBlocks, toPublicURL } from '@plone/volto/helpers';
import { getAPIResourceWithAuth } from '@plone/volto/helpers';

const HEADERS = [
  'Accept-Ranges',
  'Cache-Control',
  'Content-Disposition',
  'Content-Range',
  'Content-Type',
];

async function fetchListingContent(apiPath, APISUFIX, req, settings) {
  try {
    const request = superagent
      .get(
        `${apiPath}${__DEVELOPMENT__ ? '' : APISUFIX}${req.path.replace(
          '/rss.xml',
          '',
        )}`,
      )
      .accept('json');

    const authToken = req.universalCookies.get('auth_token');
    if (authToken) {
      request.set('Authorization', `Bearer ${authToken}`);
    }

    const response = await request;
    const json = JSON.parse(JSON.stringify(response.body));
    const listingBlock = findBlocks(json.blocks, 'listing');
    let queryData = json.blocks[listingBlock]?.querystring;

    if (!queryData) {
      throw new Error('No query data found in listing block');
    }

    if (queryData?.sort_order !== null) {
      if (typeof queryData.sort_order === 'boolean') {
        queryData.sort_order = queryData.sort_order
          ? 'descending'
          : 'ascending';
      }
    }

    let query = {
      ...queryData,
      ...(!queryData.b_size && {
        b_size: settings.defaultPageSize,
      }),
      query: queryData?.query,
      metadata_fields: '_all',
      b_start: 0,
    };

    return query;
  } catch (err) {
    throw err;
  }
}

async function fetchListingItems(query, apiPath, authToken) {
  try {
    const request = superagent
      .post(`${apiPath}/@querystring-search`)
      .send(query)
      .accept('json');

    if (authToken) {
      request.set('Authorization', `Bearer ${authToken}`);
    }

    const response = await request;
    return response.body.items;
  } catch (err) {
    throw err;
  }
}

function make_rssMiddleware(config) {
  const { settings } = config;
  const APISUFIX = settings.legacyTraverse ? '' : '/++api++';
  let apiPath = '';
  if (settings.internalApiPath && __SERVER__) {
    apiPath = settings.internalApiPath;
  } else if (__DEVELOPMENT__ && settings.devProxyToApiPath) {
    apiPath = settings.devProxyToApiPath;
  } else {
    apiPath = settings.apiPath;
  }

  async function rssMiddleware(req, res, next) {
    try {
      const query = await fetchListingContent(apiPath, APISUFIX, req, settings);
      const items = await fetchListingItems(
        query,
        apiPath,
        req.universalCookies.get('auth_token'),
      );

      const feed = new Feed({
        title: 'RSS Feed',
        description: 'Plone Site RSS Feed',
        id: settings.publicURL,
        generator: 'EEA Website',
        link: settings.publicURL,
        feedLinks: {
          rss: `${settings.publicURL}${req.path}`,
        },
      });

      items.forEach((item) => {
        feed.addItem({
          id: toPublicURL(item['@id']),
          title: item.title,
          description: item.description,
          date: item.last_modified,
        });
      });

      const result = feed.rss2();
      res.setHeader('content-type', 'application/rss+xml');
      res.send(result);
    } catch (err) {
      next(err);
    }
  }

  return rssMiddleware;
}

async function viewMiddleware(req, res, next) {
  try {
    const resource = await getAPIResourceWithAuth(req);
    // Just forward the headers that we need
    HEADERS.forEach((header) => {
      if (resource.get(header)) {
        res.set(header, resource.get(header));
      }
    });
    //check if we have listing items here
    res.status(resource.statusCode);
    res.send(resource.body);
  } catch (err) {
    next(err);
  }
}

export default function makeMiddlewares(config) {
  const middleware = express.Router();
  middleware.use(express.urlencoded({ extended: true }));
  middleware.all('**/rss.xml', make_rssMiddleware(config));
  middleware.all(['**/@@rss_feed_view'], viewMiddleware);

  middleware.id = 'rss-middleware';

  return middleware;
}
