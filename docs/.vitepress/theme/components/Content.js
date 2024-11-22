import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, Transition, watch } from 'vue';
import { useData, useRoute } from 'vitepress';
import { contentUpdatedCallbacks } from 'vitepress/dist/client/app/utils.js';
import { inView } from 'motion';

const runCbs = () => contentUpdatedCallbacks.forEach((fn) => fn());

export const Content = defineComponent({
  name: 'VitePressContent',
  props: {
    as: { type: [Object, String], default: 'div' },
  },
  setup(props) {
    const route = useRoute();
    const { site } = useData();

    let cleanup;
    let counter = 0;

    function initMotion() {
      cleanup?.();
      cleanup = inView('[data-animate]', (info) => {
        counter += 1;
        // 如果有 data-normal 就不需要延迟
        const isNormal = info.target.dataset.normal;
        info.target.style.setProperty('--stagger', isNormal ? 1 : counter);
        info.target.style.setProperty('--delay', '10ms');
        info.target.style.setProperty('--start', info.target.dataset.start ?? '0ms');
        info.target.style.animationPlayState = 'running';
      });
    }

    onMounted(() => {
      initMotion();
    });

    onBeforeUnmount(() => {
      if (cleanup) cleanup();
    });

    return () =>
      h(props.as, site.value.contentProps ?? { style: { position: 'relative' } }, [
        h(
          Transition,
          {
            name: 'fade',
            mode: 'out-in',
            onBeforeLeave() {
              cleanup();
              counter = 0;
            },
            onAfterEnter() {
              initMotion();
            },
          },
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
