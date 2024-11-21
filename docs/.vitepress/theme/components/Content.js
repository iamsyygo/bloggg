import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, Transition, watch } from 'vue';
import { useData, useRoute } from 'vitepress';
import { contentUpdatedCallbacks } from 'vitepress/dist/client/app/utils.js';

const runCbs = () => contentUpdatedCallbacks.forEach((fn) => fn());

export const Content = defineComponent({
  name: 'VitePressContent',
  props: {
    as: { type: [Object, String], default: 'div' },
  },
  setup(props) {
    const route = useRoute();
    const { site } = useData();

    let observer;
    let counter = 0;
    onMounted(() => {
      initObserver();
    });

    function initObserver() {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (
              entry.isIntersecting &&
              (entry.target.dataset.animate === '' || entry.target.dataset.animate === true) &&
              entry.target.getBoundingClientRect().top > 0
            ) {
              // 增加计数器值
              counter += 1;
              // @ts-expect-error
              entry.target.style.setProperty('--stagger', counter);
              // @ts-expect-error
              entry.target.style.setProperty('--delay', counter * 10 + 'ms');
              // @ts-expect-error
              entry.target.style.animationPlayState = 'running'; // 启动动画
            }
          });
        },
        {
          threshold: 0.1, // 当元素进入视图10%时触发
        }
      );

      document.querySelectorAll('[data-animate]').forEach((el) => {
        observer.observe(el);
      });
    }

    onBeforeUnmount(() => {
      if (observer) observer.disconnect();
    });

    watch(
      () => route.path,
      () => {
        counter = 0;
        observer.disconnect();
        nextTick(() => {
          initObserver();
        });
      },
      {
        flush: 'post',
      }
    );

    return () =>
      h(props.as, site.value.contentProps ?? { style: { position: 'relative' } }, [
        h(
          Transition,
          { name: 'fade', mode: 'out-in' },
          {
            default: () =>
              route.component
                ? h(route.component, {
                    onVnodeMounted: runCbs,
                    onVnodeUpdated: runCbs,
                    onVnodeUnmounted: runCbs,
                  })
                : '404 Page Not Found',
          }
        ),
      ]);
  },
});
