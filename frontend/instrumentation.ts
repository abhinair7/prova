// Patch localStorage when the runtime provides a broken implementation
// (happens in environments that pass --localstorage-file without a valid path)
export async function register() {
  if (
    typeof globalThis.localStorage !== "undefined" &&
    typeof globalThis.localStorage.getItem !== "function"
  ) {
    const noop = () => null;
    // @ts-expect-error — patching broken runtime-injected localStorage
    globalThis.localStorage = {
      getItem: noop,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: noop,
      length: 0,
    };
  }
}
