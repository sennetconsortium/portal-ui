import React from 'react'
import Bar from './charts/Bar'
import StackedBar from './charts/StackedBar'
import { eq } from '../js/functions'

function ChartContainer({data, subGroupLabels,  yAxis = {},
    xAxis = {}, chartType}) {
  return (
    <div>
      {eq(chartType, 'stackedBar') && <StackedBar data={data} yAxis={yAxis} xAxis={xAxis} subGroupLabels={subGroupLabels}  />}
      {eq(chartType, 'bar') && <Bar data={data} yAxis={yAxis} xAxis={xAxis}   />}
    </div>
  )
}

export default ChartContainer