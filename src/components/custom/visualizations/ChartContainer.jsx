import React, { memo } from 'react'
import Bar from './charts/Bar'
import StackedBar from './charts/StackedBar'
import HorizontalStackedBar from './charts/HorizontalStackedBar'
import GroupedBar from './charts/GroupedBar'
import HorizontalDistributionBar from './charts/HorizontalDistributionBar'
import { cls } from '@/components/custom/js/functions'

/***
 * @param {useState method} setLegend The react useState method for setting legend items
 * @param {array} data List to visualize [{group: 'x-axis label', groupLabel1: x, groupLabel2: y}, {group: 'x-axis label 2', groupLabel1: x, groupLabel2: y}]
 * @param {subGroupLabels} {object} A map of labels to use for groupLabels e.g. {groupLabel1: 'A Group Label', groupLabel2: 'Another Group Label'}
 * @param {chartId} {string} Imperative for multiple charts on same page.
 * @param {style} {object} {width, height, className}
 * @param {xAxis} {object} {formatter: function(v) for formatting axis ticks, label: string, showLabels: bool}
 * @param {yAxis} {object} {scaleLog: bool, ticks: int, label: string, showLabels: bool, showGrid: bool}
 * @param {containerClassName} {string} Additional classes for the container div
 */
const ChartContainer = memo(({children, containerClassName, ...otherProps}) => {
  const charts = {
    bar: Bar,
    groupedBar: GroupedBar,
    stackedBar: StackedBar,
    horizontalDistributionBar: HorizontalDistributionBar,
    horizontalStackedBar: HorizontalStackedBar
  }
  const DisplayChart = charts[otherProps.chartType]
  if (!DisplayChart) return <>Invalid chart</>
  return (
    <div className={cls('c-visualizations', containerClassName)}>
      <DisplayChart {...otherProps} />
      {children}
    </div>
  )
})

export default ChartContainer