export { Config, Commit, Rule };

interface Commit {
  /** the raw commit */
  raw: string;
  /** the commit title */
  title: string;
  /** the commit body */
  body: string;
  /** the CLI params (provided via --params) */
  cli?: unknown;
}

interface Rule {
  /** the name of the rule (used for automated message generation and errors) */
  name: string;
  /**
   * the validation, can be a string, regex or function (even async)
   * string => an includes check on the raw commit (unless target is set)
   * regex => a regex check on the raw commit (unless target is set)
   * function => a function which gets commit infos (title, body, raw) and CLI meta data (provided via --params), can be async
   */
  valid: RegExp | string | ((commit: Commit) => boolean | Promise<boolean>);
  /** a custom error message */
  message?: string;
  /** the target of valid (if string or regex), most likely only useful for json/yaml files */
  target?: 'title' | 'body';
  /** the type of valid (if string should be converted to a regex or be left as string), most likely only useful for json/yaml files */
  type?: 'string' | 'regex';
}

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
