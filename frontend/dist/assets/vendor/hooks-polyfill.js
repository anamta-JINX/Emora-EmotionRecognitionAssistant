
(function (React) {
  if (!React) return;
  if (!React.Fragment) {
    React.Fragment = function Fragment(props) {
      return React.createElement('div', { style: { display: 'contents' } }, props.children);
    };
  }
  if (React.useState) return;
  var originalCreateElement = React.createElement;
  var wrappers = typeof WeakMap !== 'undefined' ? new WeakMap() : new Map();
  var currentInstance = null;
  var hookIndex = 0;

  function sameDeps(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i += 1) if (!Object.is(a[i], b[i])) return false;
    return true;
  }

  function requireInstance(name) {
    if (!currentInstance) throw new Error(name + ' must be called while rendering a function component.');
    return currentInstance;
  }

  React.useState = function (initialValue) {
    var instance = requireInstance('useState');
    var index = hookIndex++;
    if (!instance.__hooks[index]) {
      instance.__hooks[index] = { kind: 'state', value: typeof initialValue === 'function' ? initialValue() : initialValue };
    }
    var hook = instance.__hooks[index];
    function setValue(nextValue) {
      var next = typeof nextValue === 'function' ? nextValue(hook.value) : nextValue;
      if (!Object.is(next, hook.value)) {
        hook.value = next;
        instance.forceUpdate();
      }
    }
    return [hook.value, setValue];
  };

  React.useRef = function (initialValue) {
    var instance = requireInstance('useRef');
    var index = hookIndex++;
    if (!instance.__hooks[index]) instance.__hooks[index] = { kind: 'ref', value: { current: initialValue } };
    return instance.__hooks[index].value;
  };

  React.useMemo = function (factory, deps) {
    var instance = requireInstance('useMemo');
    var index = hookIndex++;
    var hook = instance.__hooks[index];
    if (!hook || !sameDeps(hook.deps, deps)) {
      hook = { kind: 'memo', value: factory(), deps: deps };
      instance.__hooks[index] = hook;
    }
    return hook.value;
  };

  React.useCallback = function (callback, deps) {
    return React.useMemo(function () { return callback; }, deps);
  };

  React.useEffect = function (effect, deps) {
    var instance = requireInstance('useEffect');
    var index = hookIndex++;
    var hook = instance.__hooks[index];
    if (!hook) {
      hook = { kind: 'effect', deps: undefined, cleanup: null, pending: false, effect: null };
      instance.__hooks[index] = hook;
    }
    if (!sameDeps(hook.deps, deps)) {
      hook.deps = deps;
      hook.effect = effect;
      hook.pending = true;
    }
  };
  React.useLayoutEffect = React.useEffect;

  function runEffects(instance) {
    instance.__hooks.forEach(function (hook) {
      if (!hook || hook.kind !== 'effect' || !hook.pending) return;
      hook.pending = false;
      if (typeof hook.cleanup === 'function') {
        try { hook.cleanup(); } catch (error) { setTimeout(function () { throw error; }); }
      }
      var cleanup = hook.effect && hook.effect();
      hook.cleanup = typeof cleanup === 'function' ? cleanup : null;
    });
  }

  function getWrapper(Component) {
    if (Component.__emoraHookWrapper || (Component.prototype && Component.prototype.isReactComponent)) return Component;
    if (wrappers.has(Component)) return wrappers.get(Component);

    class HookWrapper extends React.Component {
      constructor(props) {
        super(props);
        this.__hooks = [];
      }
      componentDidMount() { runEffects(this); }
      componentDidUpdate() { runEffects(this); }
      componentWillUnmount() {
        this.__hooks.forEach(function (hook) {
          if (hook && hook.kind === 'effect' && typeof hook.cleanup === 'function') hook.cleanup();
        });
      }
      render() {
        var previous = currentInstance;
        var previousIndex = hookIndex;
        currentInstance = this;
        hookIndex = 0;
        try { return Component(this.props); }
        finally { currentInstance = previous; hookIndex = previousIndex; }
      }
    }
    HookWrapper.displayName = 'Hook(' + (Component.displayName || Component.name || 'Component') + ')';
    HookWrapper.__emoraHookWrapper = true;
    wrappers.set(Component, HookWrapper);
    return HookWrapper;
  }

  React.createElement = function (type) {
    var args = Array.prototype.slice.call(arguments);
    if (typeof type === 'function') args[0] = getWrapper(type);
    return originalCreateElement.apply(React, args);
  };
})(window.React);
