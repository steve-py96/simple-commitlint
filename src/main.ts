import type { Config } from './types';
import { join } from 'node:path';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { loadConfig } from 'unconfig';
import { parse as yamlParse } from 'yaml';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

void (async () => {
  console.log('\n\n✨  simple-commitlint  ✨');

  const exists = (file: string) =>
    access(file, constants.F_OK)
      .then(() => true)
      .catch(() => false);
  const args = await yargs(hideBin(process.argv)).argv;
  const { config, sources } = await loadConfig<Config>({
    sources: [
      {
        files: (args.config as string | undefined) || 'simple-commitlintrc',
        extensions: ['js', 'ts', 'mjs', 'json', 'yaml', 'yml'],
        transform(code, filePath) {
          if (filePath.endsWith('yaml') || filePath.endsWith('yml'))
            return JSON.stringify(yamlParse(code));

          return code;
        },
        async rewrite(code: {} | (() => {}), filepath) {
          if (filepath.endsWith('js') || filepath.endsWith('ts') || filepath.endsWith('mjs'))
            return await (typeof code === 'function' ? code() : code);

          return code;
        },
      },
    ],
  });
  const commitMsgPath = join(
    process.cwd(),
    (args.git as string | undefined) || process.env.COMMIT_EDITMSG || '.git/COMMIT_EDITMSG'
  );

  if (sources.length === 0) {
    console.error('⚠️   no simple-commitlint config found! aborting');
    process.exit(parseInt(process.env.ERROR_CONFIG_NOT_FOUND || '404', 10));
  }

  if (process.exitCode !== undefined && process.exitCode > 0 && config.forwardExitCode) {
    console.error(`⚠️   entered simple-commitlint with exitcode ${process.exitCode}, aborting!`);
    process.exit(process.exitCode);
  }

  if (!(await exists(commitMsgPath))) {
    console.error(`⚠️   ${commitMsgPath} doesn't exist!`);
    process.exit(parseInt(process.env.ERROR_COMMIT_MSG_PATH || '400', 10));
  }

  const rawContent = await readFile(commitMsgPath, { encoding: 'utf-8' });
  const relevantContent = (
    rawContent.includes('diff --git')
      ? rawContent.slice(0, rawContent.indexOf('diff --git'))
      : rawContent
  )
    .split('\n')
    .filter((row) => row[0] !== '#')
    .join('\n')
    .trimEnd();
  let title = '',
    body = '';

  if (config.prepareCommit) {
    const result = config.prepareCommit(relevantContent);

    if (typeof result === 'string') {
      console.error(`⚠️   failed to prepare commit!\n${result}`);
      process.exit(parseInt(process.env.ERROR_PREPARE_COMMIT || '123', 10));
    }

    ({ title, body } = result);
  } else {
    const [row1, ...rest] = relevantContent.split('\n');

    [title, body] = [row1, rest.join('\n')];
  }

  if (config.rules) {
    const results = await Promise.all(
      config.rules.map(async ({ valid, name, message, type, target }, index) => {
        let validResult = false,
          targetContent = relevantContent;

        if (target === 'title') targetContent = title;
        else if (target === 'body') targetContent = body;

        if (typeof valid === 'string')
          validResult =
            type === 'regex'
              ? new RegExp(valid).test(targetContent)
              : targetContent.includes(valid);
        else if (valid instanceof RegExp) validResult = valid.test(targetContent);
        else if (typeof valid === 'function')
          validResult = await valid({
            raw: relevantContent,
            title,
            body,
            cli: args.params,
          });
        else {
          console.error(
            `⚠️   rule at ${index} has no proper validation! (must be string, RegExp or function, got ${typeof valid})\n${valid}`
          );
          process.exit(parseInt(process.env.ERROR_RULE_CONFIG || '666', 10));
        }

        return {
          error: !validResult,
          message: message || `rule '${name}' failed!`,
        };
      })
    );

    if (results.some((item) => item.error)) {
      console.error(
        results
          .filter((item) => item.error)
          .map((item) => `⚠️   ${item.message}`)
          .join('\n')
      );

      process.exit(parseInt(process.env.ERROR_RULE || '1', 10));
    }
  }

  console.log('⭐️   no errors in your commit found   ⭐️');

  process.exit(0);
})();
