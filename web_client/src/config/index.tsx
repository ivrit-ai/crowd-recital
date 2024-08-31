declare global {
  interface Window {
    __env__: {
      config: Record<string, string>;
    };
  }
}

window.__env__ = window.__env__ || {};
const defaultEnvConfiguration: Record<string, string> = {};

export class EnvConfig {
  static get(key: string): string {
    if (!window.__env__) {
      throw new Error("No environment configuration found");
    }

    return window.__env__.config[key] || defaultEnvConfiguration[key];
  }

  static getInteger(key: string): number {
    return parseInt(this.get(key), 10);
  }
}
