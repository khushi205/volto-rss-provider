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

function fetchListingItems(query, apiPath, authToken) {
  return new Promise((resolve, reject) => {
    const request = superagent
      .post(`${apiPath}/@querystring-search`)
      .send(query)
      .accept('json');

    if (authToken) {
      request.set('Authorization', `Bearer ${authToken}`);
    }
    request.end((err, resp) => {
      if (resp && resp.body) {
        return resolve(resp.body.items);
      }
      return reject(err);
    });
  });
}

function fetchListingContent(apiPath, APISUFIX, req, settings) {
  return new Promise((resolve, reject) => {
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

    request.end((err, resp) => {
      if (resp && resp.body) {
        const json = JSON.parse(JSON.stringify(resp.body));
        const listingBlock = findBlocks(json.blocks, 'listing');
        let queryData = json.blocks[listingBlock]?.querystring;
        if (!queryData) {
          return reject(new Error('No query data found in listing block'));
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
        resolve(query);
      }
      reject(err);
    });
  });
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

  function rssMiddleware(req, res, next) {
    fetchListingContent(apiPath, APISUFIX, req, settings)
      .then((query) => {
        fetchListingItems(
          query,
          apiPath,
          req.universalCookies.get('auth_token'),
        )
          .then((items) => {
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
          })
          .catch(next);
      })
      .catch(next);
  }

  return rssMiddleware;
}

function viewMiddleware(req, res, next) {
  getAPIResourceWithAuth(req)
    .then((resource) => {
      // Just forward the headers that we need
      HEADERS.forEach((header) => {
        if (resource.get(header)) {
          res.set(header, resource.get(header));
        }
      });
      //check if we have listing items here
      res.status(resource.statusCode);
      res.send(resource.body);
    })
    .catch(next);
}

export default function makeMiddlewares(config) {
  const middleware = express.Router();
  middleware.use(express.urlencoded({ extended: true }));
  middleware.all('**/rss.xml', make_rssMiddleware(config));
  middleware.all(['**/@@rss_feed_view'], viewMiddleware);

  middleware.id = 'rss-middleware';

  return middleware;
}
