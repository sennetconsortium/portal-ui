import React, { memo } from 'react'
import Bar from './charts/Bar'
import StackedBar from './charts/StackedBar'
import HorizontalStackedBar from './charts/HorizontalStackedBar'
import { eq } from '../js/functions'
import GroupedBar from './charts/GroupedBar'
import HorizontalDistributionBar from './charts/HorizontalDistributionBar'

/***
 * @param {useState method} setLegend The react useState method for setting legend items
 * @param {array} data List to visualize [{group: 'x-axis label', groupLabel1: x, groupLabel2: y}, {group: 'x-axis label 2', groupLabel1: x, groupLabel2: y}]
 * @param {subGroupLabels} {object} A map of labels to use for groupLabels e.g. {groupLabel1: 'A Group Label', groupLabel2: 'Another Group Label'}
 * @param {chartId} {string} Imperative for multiple charts on same page. 
 * @param {style} {object} {width, height, className}
 * @param {xAxis} {object} {formatter: function(v) for formatting axis ticks, label: string, showLabels: bool}
 * @param {yAxis} {object} {scaleLog: bool, ticks: int, label: string, showLabels: bool, showGrid: bool}
 */
const ChartContainer = memo(({children, data, subGroupLabels, setLegend, chartId,  yAxis = {}, xAxis = {}, style = {}, chartType}) => {
  return (
    <div>
      {eq(chartType, 'stackedBar') && <StackedBar data={data} chartId={chartId} setLegend={setLegend} yAxis={yAxis} xAxis={xAxis} subGroupLabels={subGroupLabels}  />}
      {eq(chartType, 'horizontalDistributionBar') && <HorizontalDistributionBar data={data} chartId={chartId} setLegend={setLegend} yAxis={yAxis} xAxis={xAxis} subGroupLabels={subGroupLabels} style={style}  />}
      {eq(chartType, 'horizontalStackedBar') && <HorizontalStackedBar data={data} chartId={chartId} setLegend={setLegend} yAxis={yAxis} xAxis={xAxis} subGroupLabels={subGroupLabels} style={style}  />}
      {eq(chartType, 'bar') && <Bar data={data} chartId={chartId} setLegend={setLegend} yAxis={yAxis} xAxis={xAxis}   />}
      {eq(chartType, 'groupedBar') && <GroupedBar data={data} chartId={chartId} setLegend={setLegend} yAxis={yAxis} xAxis={xAxis} subGroupLabels={subGroupLabels}  />}
      {children}
    </div>
  )
})

export default ChartContainer