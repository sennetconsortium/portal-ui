import React from 'react'
import Bar from './charts/Bar'
import StackedBar from './charts/StackedBar'
import HorizontalStackedBar from './charts/HorizontalStackedBar'
import { eq } from '../js/functions'
import GroupedBar from './charts/GroupedBar'

function ChartContainer({data, subGroupLabels, chartId,  yAxis = {},
    xAxis = {}, style = {}, chartType}) {
  return (
    <div>
      {eq(chartType, 'stackedBar') && <StackedBar data={data} chartId={chartId} yAxis={yAxis} xAxis={xAxis} subGroupLabels={subGroupLabels}  />}
      {eq(chartType, 'horizontalStackedBar') && <HorizontalStackedBar data={data} chartId={chartId} yAxis={yAxis} xAxis={xAxis} subGroupLabels={subGroupLabels} style={style}  />}
      {eq(chartType, 'bar') && <Bar data={data} chartId={chartId} yAxis={yAxis} xAxis={xAxis}   />}
      {eq(chartType, 'groupedBar') && <GroupedBar data={data} chartId={chartId} yAxis={yAxis} xAxis={xAxis} subGroupLabels={subGroupLabels}  />}
    </div>
  )
}

export default ChartContainer