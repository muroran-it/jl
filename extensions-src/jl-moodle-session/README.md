# jl-moodle-session

JupyterLite / JupyterLab frontend extension for reading the Moodle LTI session from the Cloudflare Worker.

## Current endpoints

- JupyterLite: `https://jl.morecatlab.workers.dev/`
- LTI Worker: `https://jl-lti.morecatlab.workers.dev/`
- Session API: `https://jl-lti.morecatlab.workers.dev/api/session`

## What this extension does

At JupyterLite startup, the extension calls:

```javascript
fetch("https://jl-lti.morecatlab.workers.dev/api/session", {
  credentials: "include"
})
```

If the LTI session is valid, it shows a status such as:

```text
Moodle: Test-course / User 6 / Learner
```

in the JupyterLab status bar.

The verified session is also placed in `window.jlMoodleSession` for later frontend development and debugging.

**Security note:** `window.jlMoodleSession` must not be used as an authorization source. Future save/load APIs must identify the user from the signed `jl_session` cookie on the Worker side.

## Build the extension

From the repository root:

```bash
cd extensions/jl-moodle-session
jlpm install
jlpm run build:prod
cd ../..
```

The build output is created in `extensions/jl-moodle-session/labextension/`.

## Make JupyterLite discover the extension

Before building JupyterLite:

```bash
jupyter labextension develop extensions/jl-moodle-session --overwrite
```

Then run the existing JupyterLite build:

```bash
jupyter lite doit --contents content --output-dir dist -- --backend=json pre_build build post_build
```

## Suggested Cloudflare build command

```bash
cd extensions/jl-moodle-session && \
jlpm install && \
jlpm run build:prod && \
cd ../.. && \
jupyter labextension develop extensions/jl-moodle-session --overwrite && \
jupyter lite doit --contents content --output-dir dist -- --backend=json pre_build build post_build
```

Deploy remains:

```bash
npx wrangler deploy
```

## CORS requirement

The LTI Worker `/api/session` response must include:

```text
Access-Control-Allow-Origin: https://jl.morecatlab.workers.dev
Access-Control-Allow-Credentials: true
```

## Test

1. Launch JupyterLite from Moodle as a student.
2. Confirm the status bar shows `Moodle: Test-course / User 6 / Learner`.
3. In the browser console, run `window.jlMoodleSession`.
4. Confirm logs beginning with `[jl-moodle-session]`.

## Next step

After this minimal extension works, add authenticated save/load endpoints to the LTI Worker and store notebooks in R2 using a server-derived key such as:

```text
courses/{courseId}/users/{sub}/{filename}
```
