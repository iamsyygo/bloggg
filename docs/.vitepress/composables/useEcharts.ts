import { ECharts, EChartsType } from 'echarts';
import { onMounted, ref } from 'vue';
import echarts from '../utils/echarts';

export const useEcharts = () => {
  const elRef = ref<HTMLElement | null>(null);
  const chart = ref<ECharts>();
  onMounted(() => {
    // @ts-expect-error
    chart.value = echarts.init(elRef.value as HTMLElement);
  });

  return { elRef, chart };
};

// @ts-expect-error
window.useEcharts = useEcharts;
