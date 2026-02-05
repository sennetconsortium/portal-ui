import React, {useState, memo} from 'react'
import CellTypeDistributionAcrossOrgansLayout from './CellTypeDistributionAcrossOrgansLayout'
import { VisualizationsProvider } from '@/context/VisualizationsContext'
import ChartContainer from '../visualizations/ChartContainer'
import { formatNum, getUBKGFullName } from '../js/functions'
import { prepareStackedData } from '../visualizations/charts/StackedBar'
import * as d3 from 'd3';

/**
 * @param {object} organ The current organ
 * @param {object} tabData Data of the current tab {[organ._id]: {data, cells, types}}
 * @param {object} cell The current cell {id, label}
 */
const CellTypeDistributionAcrossOrgansTab = memo(({organ, tabData, cell}) => {
  const [legend, setLegend] = useState({})

  const getAxis = () => {
    return { showLabels: false, showGrid: false, scaleLog: false }
  }

  const _colorScale = d3.scaleSequential(d3.interpolateWarm)

  const colorScale = ({d, maxY}) => {
    return _colorScale(d[0].data[d.key] / maxY)
  }

  return (
    <div>
      <div>The bar below shows the distribution of cell types in the {organ.label} tissue. The distribution is based on the number of cells annotated in SenNet datasets.</div>
      <VisualizationsProvider>
        <ChartContainer
          setLegend={setLegend}
          chartId={getUBKGFullName(organ._id).toDashedCase()}
          data={prepareStackedData(tabData[organ._id].data, false)}
          xAxis={getAxis()} yAxis={getAxis()}
          style={{
            className: 'c-visualization__noAxis',
            hideViewbox: true, highlight: cell.label,
            transform: 'translate(0, 30)', strict: true,
            key: organ._id,
            height: 120, 
            colorScheme: d3.schemeTableau10
            //colorScale
          }}
          chartType={'horizontalDistributionBar'} />

      </VisualizationsProvider>
      <CellTypeDistributionAcrossOrgansLayout organ={organ} cell={cell} tabData={tabData} legend={legend}>
      </CellTypeDistributionAcrossOrgansLayout>
    </div>
  )
})

export default CellTypeDistributionAcrossOrgansTab