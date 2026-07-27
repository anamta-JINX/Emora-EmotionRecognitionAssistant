export function createRoot(container) {
  if (window.ReactDOM && typeof window.ReactDOM.createRoot === 'function') {
    return window.ReactDOM.createRoot(container);
  }
  return {
    render(element) {
      window.ReactDOM.render(element, container);
    },
    unmount() {
      if (window.ReactDOM && typeof window.ReactDOM.unmountComponentAtNode === 'function') {
        window.ReactDOM.unmountComponentAtNode(container);
      }
    },
  };
}

export default { createRoot };
