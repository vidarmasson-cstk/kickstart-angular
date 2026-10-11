> Note that this project is not an official Contentstack maintained repo yet. This is a work in progress and will be updated over time. When it is finished enough it will move to the official Contentstack Github home.

# Contentstack Kickstart: Angular 18

This is a kickstart example to connect Angular to Contentstack.
This example covers the following items:

- SDK initialization
- Live preview and Visual building setup

More details about this codebase can be found on the [Contentstack docs](https://www.contentstack.com/docs/developers).

[![Join us on Discord](https://img.shields.io/badge/Join%20Our%20Discord-7289da.svg?style=flat&logo=discord&logoColor=%23fff)](https://community.contentstack.com)

## How to get started

Before you can run this code, you will need a Contentstack "Stack" to connect to.
Follow the following steps to seed a Stack that this codebase understands.

> If you installed this Kickstart via the Contentstack Markertplace or the new account onboarding, you can skip this step.

### Install the CLI

```bash
npm install -g @contentstack/cli
```

#### Using the CLI for the first time?

It might ask you to set your default region.
You can get all regions and their codes [here](https://www.contentstack.com/docs/developers/cli/configure-regions-in-the-cli) or run `csdx config:get:region`.

> Beware, Free Contentstack developer accounts are bound to the EU region. We still use the CDN the API is lightning fast.

Set your region like so:

```bash
csdx config:set:region EU
```

### Log in via the CLI

```bash
csdx auth:login
```

### Get your organization UID

In your Contentstack Organization dashboard find `Org admin` and copy your Organization ID (Example: `blt481c598b0d8352d9`).

### Create a new stack

Make sure to replace `<YOUR_ORG_ID>` with your actual Organization ID and run the below.

```bash
csdx cm:stacks:seed --repo "contentstack/kickstart-stack-seed" --org "<YOUR_ORG_ID>" -n "Circle K Angular"
```

### Add the Circle K demo content

This fork turns the kickstart into a Circle K demo: a Landing Page content type, Circle K images and copy,
and a reusable Deal global field used by Deal Pages and Landing Pages. Add it to the stack you just seeded:

```bash
npm install
npm run setup:stack -- <YOUR_STACK_API_KEY>
```

The API key is shown when the seed finishes, and under Settings > Stack in Contentstack. The script runs the
migrations in `contentstack/` in order:

| Migration | What it does |
|---|---|
| `landing-page` | Landing Page content type, `/coffee` and `/ev-charging` pages, preview environment URL set to `http://localhost:4200/`, and a delivery and preview token written into `.env` |
| `circlek-assets` | Uploads the Circle K images and puts them on the pages; deletes placeholder images nothing uses |
| `homepage-copy` | Circle K copy on the home page |
| `deals` | `deal` global field, Deal Page content type with three `/deals/...` pages, and a featured deal on `/coffee` |

It creates `.env` from `.env.example` if needed. Each migration can be rerun safely, so if a step fails, fix
the cause and run the script again. With the content in place, skip ahead to [Turn on Live Preview](#turn-on-live-preview).

> The Circle K images are downloaded from circlek.ie and are for internal demos only.

The next two steps are only needed for the plain kickstart, without `setup:stack`.

### Create a new delivery token.

Go to Settings > Tokens and create a delivery token. Select the `preview` scope and turn on `Create preview token`

> In the case of Angular 18, check the settings in the environment and make sure the url is: `http://localhost:4200/` instead of `http://localhost:3000/`

### Configure your environment variables

This project uses environment variables to keep API keys secure and out of version control.

1. Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill out the `.env` file with your actual values:
   ```env
   NG_APP_CONTENTSTACK_API_KEY=<YOUR_API_KEY>
   NG_APP_CONTENTSTACK_DELIVERY_TOKEN=<YOUR_DELIVERY_TOKEN>
   NG_APP_CONTENTSTACK_PREVIEW_TOKEN=<YOUR_PREVIEW_TOKEN>
   NG_APP_CONTENTSTACK_ENVIRONMENT=preview
   NG_APP_CONTENTSTACK_REGION=EU
   NG_APP_CONTENTSTACK_PREVIEW=true
   ```

The environment files (`src/environments/environment.ts` and `src/environments/environment.production.ts`) are automatically generated from your `.env` file when you run `npm start` or `npm run build`.

> **Important:** Never commit the `.env` file to your repository. It's already included in `.gitignore` to prevent accidental commits of your API keys.

### Turn on Live Preview

Go to Settings > Live Preview. Click enable and select the `Preview` environment in the drop down. Hit save.

### Install the dependencies

```bash
npm install
```

### Run your app

```bash
npm run start
```

### See your page visually

### In the browser

Go to `http://localhost:4200/`.

#### In the CMS

Go to Entries and select the only entry in the list.
In the sidebar, click on the live preview icon.
Or, click on visual experience in the sidebar.

## Regions and endpoint configuration

Set `NG_APP_CONTENTSTACK_REGION` to the value matching your Contentstack account region:

| Region | Value |
|---|---|
| North America (default) | `NA` or `US` |
| Europe | `EU` |
| Australia | `AU` |
| Azure North America | `AZURE-NA` |
| Azure Europe | `AZURE-EU` |
| GCP North America | `GCP-NA` |
| GCP Europe | `GCP-EU` |

The app uses `getContentstackEndpoint` from `@contentstack/utils` to resolve the correct API hostnames for your region automatically (via `generate-env.js` at build time). The following endpoint keys are resolved:

| Key | NA value |
|---|---|
| `contentDelivery` | `cdn.contentstack.io` |
| `preview` | `rest-preview.contentstack.com` |
| `application` | `app.contentstack.com` |
| `graphqlDelivery` | `graphql.contentstack.com` |
| `graphqlPreview` | `graphql-preview.contentstack.com` |
| `images` | `images.contentstack.io` |
| `assets` | `assets.contentstack.io` |
| `contentManagement` | `api.contentstack.io` |
| `auth` | `auth.contentstack.io` |

### Custom or dedicated environments

If you are on a dedicated or private cloud Contentstack instance, you can override the resolved endpoints via environment variables:

```
NG_APP_CONTENTSTACK_CONTENT_DELIVERY=your-custom-cdn.example.com
NG_APP_CONTENTSTACK_PREVIEW_HOST=your-custom-preview.example.com
NG_APP_CONTENTSTACK_CONTENT_APPLICATION=your-custom-app.example.com
```

These override values take precedence over the region-resolved endpoints.
