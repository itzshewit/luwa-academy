declare module 'react-chartjs-2' {
  import { ChartData, ChartOptions } from 'chart.js';
  import { ForwardRefExoticComponent, RefAttributes } from 'react';

  export interface ChartProps {
    data: ChartData;
    options?: ChartOptions;
  }

  export const Line: ForwardRefExoticComponent<ChartProps & RefAttributes<unknown>>;
  export const Bar: ForwardRefExoticComponent<ChartProps & RefAttributes<unknown>>;
}