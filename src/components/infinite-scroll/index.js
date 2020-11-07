const scope = 'GoInfiniteScroll';
const defaultProps = {
  disabled: false,
  distance: 40,
  immediate: true,
  delay: 300
};
const getContainer = (el) => {
  let container = el;
  while (container) {
    if (container === document) {
      return container;
    }
    const { overflowY, overflow } = getComputedStyle(container);
    const regexp = /auto|scroll/;
    if (regexp.test(overflow) || regexp.test(overflowY)) {
      return container;
    }
    container = container.parentNode;
  }
};
const getOptions = (el) => {
  return Object.entries(defaultProps).reduce((options, [key, val]) => {
    options[key] = el.getAttribute(`infinite-scroll-${key}`) ?? val;
    return options;
  }, {});
};

function scrollHandler (el, load, e) {
  // 1. 如果没有加载到指定高度，就会调用load方法进行加载
  const { distance, disabled } = getOptions(el);
  if (disabled) {return;}
  const loadHeight = this.offsetHeight + Number(distance) + this.scrollTop;
  const scrollHeight = this.scrollHeight;
  if (scrollHeight <= loadHeight) {
    load();
  }
}

// 在指定时间内只触发一次
function throttle (fn, delay) {
  let timerId = null;
  return function (...args) {
    if (timerId) {return;}
    timerId = setTimeout(() => {
      fn.call(this, ...args);
      timerId = null;
    }, delay);
  };
}

// 如果用户传入immediate: true,需要默认将数据填满container
// MutationObserver: 提供了观察对dom树更改的能力
const install = (Vue) => {
  Vue.directive('infinite-scroll', {
    name: scope,
    bind (el, binding) { // Only called once, when the directive is first bound to the element. This is where you can do one-time setup work
      Vue.nextTick(() => {
        const container = getContainer(el);
        const { immediate } = getOptions(el);
        const onScroll = throttle(scrollHandler, 200).bind(container, el, binding.value);
        el[scope] = { container, onScroll };
        if (immediate) {
          const observer = new MutationObserver(onScroll);
          el[scope].observe = observer.observe(container, {
            childList: true,
            subtree: true
          });
          onScroll();
        }
        container.addEventListener('scroll', onScroll);
      });
    },
    unbind (el) {
      const { container, onScroll, observe } = el[scope];
      container.removeEventListener('scroll', onScroll);
      if (observe) {
        observe.disconnect();
      }
    }
  });
};

export default install;
