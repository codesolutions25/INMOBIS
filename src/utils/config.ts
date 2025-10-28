export const getConfig = () => {
    if (typeof window !== "undefined" && window.__RUNTIME_CONFIG__) {
      return window.__RUNTIME_CONFIG__;
    }
    return {};
  };
  