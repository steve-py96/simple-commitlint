![GitHub package.json version](https://img.shields.io/github/package-json/v/steve-py96/ahocon?style=flat-square&color=000000)

# simple-commitlint

commitlint, but in simpler ✨

<br />
<br />

## how to use

1. `npm i -D simple-commitlint` / `yarn add -D simple-commitlint`
2. create a config file `simple-commitlintrc` with one of the following extensions: `js`, `ts`, `mjs`, `json`, `yml`/`yaml`

<br />
<br />

## plain configuration

(taken from [types.ts](./src/types.ts), for further details check it out)

```ts
interface Config {
  /**
   * prepare the commit by providing an own logic to separate title and body (return a string if it's an invalid commit to prepare)
   * by default it's title = row[0], body = otherRows
   */
  prepareCommit?: (raw: string) => Pick<Commit, 'title' | 'body'> | string;
  /** an array of rules (which must have a name and a validation), if left empty the linter exits with code 0 */
  rules?: Array<Rule>;
  /** set to true if you want to exit on an already existing non-zero exit code (it's simply forwarded) */
  forwardExitCode?: boolean;
}
```

It's recommended to use js/ts files in combination with the exported `defineConfig` function for autocompletion and more flexibility.
Create a `simple-commitlintrc.js` f.e. like this

```js
  // simple-commitlintrc.js
  import { defineConfig } from 'simple-commitlint/helpers'

  // -------------------
  // and ONE of the following possibilities
  // -------------------

  // possibility 1 (object within)
  export default defineConfig({ ... })

  // possibility 2 (function that returns an object within)
  export default defineConfig(() => ({ ... }))

  // possibility 3 (function that returns a promise with the object within)
  export default defineConfig(async () => ({ ... }))
```

<br />
<br />

## usage

### parameters

| name       | purpose                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--git`    | the path for the COMMIT_EDITMSG                                                                                              |
| `--params` | params to pass to validation functions                                                                                       |
| `--config` | use a different name than simple-commitlintrc (name should be provided without extension, still allows all extensions then!) |

<br />

### husky

Most likely you'll use this with [husky](https://github.com/typicode/husky). For that purpose setup husky and run `npx husky add .husky/commit-msg "npx --no-install simple-commitlint --git $1"` (pretty similar to the use of husky with the original [commitlint](https://github.com/conventional-changelog/commitlint/)).

<br />

### simple example rules

<details>
  <summary> head not empty </summary>

```js
defineConfig({
  rules: [
    {
      name: 'head-not-empty',
      valid({ title }) {
        return title.length > 0;
      },
    },
  ],
});
```

</details>

<details>
  <summary> body not directly under head </summary>

```js
defineConfig({
  rules: [
    {
      name: 'body-not-directly-under-head',
      valid({ body }) {
        return body.split('\n')[0].trim().length === 0;
      },
    },
  ],
});
```

</details>

<details>
  <summary> jira </summary>

```js
defineConfig({
  rules: [
    {
      name: 'jira',
      valid({ title }) {
        return /^[A-Z]+-\d+ ?(?:\/\/?|:) ?[^\/ ].*$/.test(title);
      },
    },
  ],
});
```

</details>

<details>
  <summary> only allow when certain path was changed (advanced) </summary>

(required to add params, example within `.husky/commit-msg`)

```sh
  npx simple-commitlint --git $1 --params "$(git diff --name-only)"
```

```js
defineConfig({
  rules: [
    {
      name: 'special-case',
      valid({ title, cli }) {
        if (cli.split('\n').some((path) => path.endsWith('fileABC.ts')))
          return /someSpecialTest/.test(title);

        return /defaultTest/.test(title);
      },
    },
  ],
});
```

</details>

<br />
<br />

## upcoming

- more examples (maybe on a separate page)
- more flexibility (prolly giving `prepareCommit` more power)
- improvements of the CLI output
- ...
