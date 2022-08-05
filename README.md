## Working with submodule

This repository relies on the [search-ui](https://github.com/dbmi-pitt/search-ui) as a submodule to function. The
file `.gitmodules` contains the configuration for the URL and specific branch of the submodule that is to be used. Once
you already have cloned this repository and switched to the target branch, to load the latest `search-ui` submodule:

```
git submodule update --init --remote
```

## For Local Development

Create a file called `.env.local` at the root of the project with the same structure as `sample.env`. Modify the
variables as needed.

### Required services

The `ingest-api` must be running locally and for the time being you must change the variable `GLOBUS_CLIENT_APP_URI`
in `app.cfg` to be 'http://localhost:3000/' for redirects to work properly. You can start the `ingest-api` with the
following command:

```
$ ingest-api/src/python app.py
```

The `search-api` must be running via Docker to avoid CORS related problems. You can start the `search-api` with the
following command:

```
$ ./search-api-docker.sh localhost start
```

To start the application run the following commands:\
 **_Note:_** This application requires Node.js 12.22.0 or later

```
$ npm install
$ npm run dev
```


