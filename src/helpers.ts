import { Config } from './types';

export { defineConfig };

const defineConfig = (config: Config | (() => Config | Promise<Config>)) =>
  typeof config === 'function' ? config() : config;
