export function createBridge() {
  const target = new EventTarget();
  return {
    on(name, handler) {
      const callback = (e) => handler(e.detail);
      target.addEventListener(name, callback);
      return () => target.removeEventListener(name, callback);
    },
    emit(name, detail) {
      target.dispatchEvent(new CustomEvent(name, { detail }));
    },
  };
}
