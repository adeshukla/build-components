# A website from Build Components

This repository is what the **Deploy to Vercel** button in the [Build Components](https://build-components.devstash.me/build)
builder clones. It holds no website of its own: before each build, `get-site.mjs` fetches your website's files
from the address in the `SITE_FILES_URL` environment variable, which the button filled in for you. Then
`next build` builds them as an ordinary Next.js project.

## Forms

The site's forms send to its own `/api/forms`. Set `FORM_WEBHOOK_URL` in the Vercel project's Environment
Variables to pass messages on (a Slack incoming webhook, a Zapier or Make hook, or your own endpoint), then
redeploy. Until then, messages are written to the deployment's logs.

## Making the code yours

To edit the site by hand instead of in the builder, fetch its files once and commit them:

    SITE_FILES_URL="<the value from Vercel>" node get-site.mjs
    git add . && git commit -m "The website's own files"

Then change the `build` script in `package.json` to `next build` and remove `SITE_FILES_URL`. From then on
the repository is the website, like any Next.js project.
