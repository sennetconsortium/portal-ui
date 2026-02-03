import React from 'react'
import StackedBar from './charts/StackedBar'

function ChartContainer({data, subGroupLabels,  yAxis = {},
    xAxis = {}, chartType}) {
  return (
    <div>
      <StackedBar data={data} yAxis={yAxis} xAxis={xAxis} subGroupLabels={subGroupLabels}  />
    </div>
  )
}

export default ChartContainer