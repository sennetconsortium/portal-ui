# SenNet Data Portal

## Working with submodule

This repository relies on the [search-ui](https://github.com/dbmi-pitt/search-ui) as a submodule to function. The
file `.gitmodules` contains the configuration for the URL and specific branch of the submodule that is to be used. Once
you already have cloned this repository and switched to the target branch, to load the latest `search-ui` submodule:

```
git submodule update --init --remote
```

## For Local Development

Create a file called `.env.local` in `/src` with the same structure as `example.env`. Modify the
variables as needed.

### Required services

The `ingest-api` must be running locally and for the time being you must change the variable `GLOBUS_CLIENT_APP_URI`
in `app.cfg` to be 'http://localhost:3000/' for redirects to work properly. You can start the `ingest-api` with the
following command:

```
$ ingest-api/src/python app.py
```

The `search-api` and `entity-api` must be running via Docker to avoid CORS related problems. You can start the `search-api` with the
following command:

```
$ ./search-api-docker.sh localhost start
```

To start the application run the following commands inside `/src`:\
 **_Note:_** This application requires Node.js 18 or later

```
$ npm install
$ npm run run
```

## Docker deployment

For docker deployment, first create `.env.local` file base on `example.env` file in the same `src` directory.

### Docker build for DEV development

There are a few configurable environment variables to keep in mind:

- `HOST_UID`: the user id on the host machine to be mapped to the container. Default to 1000 if not set or null.
- `HOST_GID`: the user's group id on the host machine to be mapped to the container. Default to 1000 if not set or null.
- `PORTAL_UI_CLOUDWATCH_LOG_GROUP='/aws/ec2/sennet-dev/portal-ui/next-server'`: The Cloudwatch log group that saves the nodejs/next-js server logs

```
cd docker
./docker-development.sh [check|config|build|start|stop|down]
```

### Docker build for deployment on TEST/STAGE/PROD

```
cd docker
docker pull hubmap/portal-ui:1.0.0 (replace with the actual released version number)
./docker-deployment.sh [start|stop|down]
```
Environment vars
- `PORTAL_UI_CLOUDWATCH_LOG_GROUP='/aws/ec2/sennet-prod/portal-ui/next-server'`: The Cloudwatch log group that saves the nodejs/next-js server logs

## Vitessce
[Visual integration tool for exploration of spatial single cell experiments](http://vitessce.io/)

[Vitessce docs](http://vitessce.io/docs/)

Vitessce is embedded in the view dataset page for sn-RNA-seq data types. The React component takes 3 props as input, a json object named config that describes the visualizations, a theme, and the height.

### Vitessce View Config
The view config is responsible for which views are rendered, what data is fetched, and the layout of the views. Vitessce can render many views for each individual dataset. The files are served by the [assets service](https://github.com/sennetconsortium/file-assets-auth)

An example json view config is `src/SNT753.WGBZ.884-snRNA-seq-large-intestine.js`

*Hint* `The view config is logged in the browser console for HubMAP and SenNet.`

You can copy/paste the json object into the Vitessce [app](http://vitessce.io/#?edit=true).

[Vitessce JS view config API](http://vitessce.io/docs/view-config-js/)

### Vitessce App to validate view configs
During development, we can use the vitessce app to validate view configs. It will tell us if there are any errors in the config and then load the visualizations in the browser.


[Vitessce app](http://vitessce.io/#?edit=true)

## Usage

```
const Vitessce = React.lazy(() => import ('../components/custom/VitessceWrapper.js'))
<Vitessce config={config} theme={'light'} height={800}/>
```

## Common Coordination Framework Registration User Interface (CCF-RUI)
The CCF-RUI allows a user to locate and record 3D coordinates of tissue blocks sampled from organs. Example [HubMAP RUI](https://hubmapconsortium.github.io/ccf-ui/rui/)

[CCF-UI github repo](https://github.com/hubmapconsortium/ccf-ui)

The tool is integrated as a web component with a react component wrapping it. The web component is

```markdown
<ccf-rui
  ref={this.ruiRef}
  base-href="https://cdn.jsdelivr.net/gh/hubmapconsortium/ccf-ui@3/rui/"
  theme={'sennet'}
/>
```

The react component is `src/components/custom/edit/sample/rui/RUIIntegration.js`

The tool is only available for human `Block` tissue samples with an ancestor of `Organ`

The `Register location` button will display on the edit sample page and launch the CCF-RUI tool.

## Content Management
### Banner
Currently, two locations offer adding a banner via adding/updating `public/content/banners/index.json` file without having to rebuild the image. To specify that both locations use the same banner,
use the key `default` as property name. To use different banners per location, specify the property name `login` and/or `homepage`.
#### `login` Located before the Login section
```
{
  "login": {
    "content": "..."
  }
}
```

#### `homepage` Located on the homepage
```
{
  "homepage": {
    "content": "..."
  }
}
```
#### `default` This banner will be used for locations not specified.
```
{
  "default": {
    "content": "..."
  }
}
```
Configure the json object with the following properties:

| Property                  | Type          | Description                                                                                                         |
|---------------------------|---------------|---------------------------------------------------------------------------------------------------------------------|
| **theme**                 | *enum string* | `["info", "danger", "warning"]` Default: `warning`.                                                                 |
| **title**                 | *html string* | A title for the `Alert`, which is the actual banner. (Going forward we will call this just 'banner'.)               |
| **content**               | *html string* | Required. The main banner content.                                                                                  |
| **dismissible**           | *boolean*     | Add a close button to the banner.                                                                                   |
| **keepDismissed**         | *boolean*     | Keep the banner dismissed on close. The banner will show again on refresh if this is set to `false` or `undefined`. |
| **className**             | *string*      | A class name for the banner. Default: `mt-4`.                                                                       |
| **innerClassName**        | *string*      | A class name for inner wrapper of the banner.                                                                       |
| **outerWrapperClassName** | *string*      | A class name for the div that wraps the banner.                                                                     |
| **beforeBanner**          | *html string* | Set some content before the banner.                                                                                 |
| **beforeBannerClassName** | *string*      | Set a class name on div of `beforeBanner`.                                                                          |
| **afterBanner**           | *html string* | Set some content after the banner.                                                                                  |
| **afterBannerClassName**  | *string*      | Set a class name on div of `afterBanner`.                                                                           |
| **sectionClassName**      | *string*      | A class name for the `c-SenNetBanner` section. Default: `sui-layout-body`.                                          |
| **ariaLabel**             | *string*      | For accessibility, add a unique label to the `c-SenNetBanner` section                                               |

## Custom Plugins
There are some custom JS plugins located in `src/components/custom/js/addons` which adds additional functionality to the UI on HTML elements with classes or properties like `js-{app}--{component}` or `data-js-{app}` respectively.
The ES6 classes have been excluded from docker build time and are automatically rebuilt to `main-plugins.js` when developing under `npm run run` or `npm run plugins-watch`. 
Use `npm run plugins` to manually rebuild. Also note: the `src/components/custom/js/addons/plugins/__polyfill.js` file should not be edited, it's provided by babel and adds cross browser support.