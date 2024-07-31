# volto-rss-provider

## Considerations for `volto-rss-provider`

### Introduction

The `volto-rss-provider` add-on enables RSS feed generation for a Volto site. It uses the `rss_feed` content type, which contains a listing block for querying items to be displayed in the RSS feed. The feed can be accessed via URLs like `http://<website-domain>/<path-to-feed>/rss.xml`.

### Features

- Generates RSS feeds using Express middleware.
- Supports Atom format for the feed.
- Customizable feed options based on the `rss_feed` content type.
- Allows users to specify tags, which become categories in the RSS feed.
- Supports a variety of item options, including authors, categories, and enclosures, such as images.

### Setting Up the RSS Feed

The `rss_feed` content type includes a listing block. Use the listing block to query the items you want to display in the feed. The generated feed will include the specified items in RSS XML format.

### Feed Options

The following options are supported for the RSS feed:

- **title**: The title of the RSS feed, derived from the `rss_feed` content type.
- **description**: A description of the RSS feed, also from the `rss_feed` content type.
- **feed_url**: The URL to the RSS feed.
- **site_url**: The URL to the site the feed is for.
- **generator**: The name of the feed generator.
- **language**: The language of the feed content.
- **categories**: Tags specified in the `rss_feed` content type, used as categories for the RSS feed.

### Item Options

The following options are supported for each item in the RSS feed:

- **title**: The title of the item.
- **description**: The description of the item.
- **url**: The URL to the item.
- **date**: The date the item was last modified.
- **author**: The authors of the item, derived from the `listCreators` data field and set by the `Creators` option.
- **categories**: The categories for the item, derived from the `Subject` data field and set by the `Tags` option.
- **enclosure**: The enclosure for the item, typically used for images.

### Image Precedence

The precedence for images in the RSS feed is as follows:

1. `previewImage` (if available)
2. `leadImage` (if `previewImage` is not available)
3. `null` (if neither `previewImage` nor `leadImage` is available)

### Accessing the RSS Feed

After setting up the `rss_feed` content type and configuring the listing block, you can access the generated RSS feed at:

```
http://<website-domain>/<path-to-feed>/rss.xml
```

This URL will return the RSS feed in XML format.

## Development

You can develop an add-on in isolation using the boilerplate already provided by the add-on generator.
The project is configured to have the current add-on installed and ready to work with.
This is useful to bootstrap an isolated environment that can be used to quickly develop the add-on or for demo purposes.
It's also useful when testing an add-on in a CI environment.

```{note}
It's quite similar when you develop a Plone backend add-on in the Python side, and embed a ready to use Plone build (using buildout or pip) in order to develop and test the package.
```

The dockerized approach performs all these actions in a custom built docker environment:

1. Generates a vanilla project using the official Volto Yo Generator (@plone/generator-volto)
2. Configures it to use the add-on with the name stated in the `package.json`
3. Links the root of the add-on inside the created project

After that you can use the inner dockerized project, and run any standard Volto command for linting, acceptance test or unit tests using Makefile commands provided for your convenience.

### Setup the environment

Run once

```shell
make dev
```

which will build and launch the backend and frontend containers.
There's no need to build them again after doing it the first time unless something has changed from the container setup.

In order to make the local IDE play well with this setup, is it required to run once `yarn` to install locally the required packages (ESlint, Prettier, Stylelint).

Run

```shell
yarn
```

### Build the containers manually

Run

```shell
make build-backend
make build-addon
```

### Run the containers

Run

```shell
make start-dev
```

This will start both the frontend and backend containers.

### Stop Backend (Docker)

After developing, in order to stop the running backend, don't forget to run:

Run

```shell
make stop-backend
```

### Linting

Run

```shell
make lint
```

### Formatting

Run

```shell
make format
```

### i18n

Run

```shell
make i18n
```

### Unit tests

Run

```shell
make test
```

### Acceptance tests

Run once

```shell
make install-acceptance
```

For starting the servers

Run

```shell
make start-test-acceptance-server
```

The frontend is run in dev mode, so development while writing tests is possible.

Run

```shell
make test-acceptance
```

To run Cypress tests afterwards.

When finished, don't forget to shutdown the backend server.

```shell
make stop-test-acceptance-server
```

### Release

Run

```shell
make release
```

For releasing a RC version

Run

```shell
make release-rc
```
