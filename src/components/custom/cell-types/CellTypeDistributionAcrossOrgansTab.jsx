import React, {useState, memo} from 'react'
import CellTypeDistributionAcrossOrgansLayout from './CellTypeDistributionAcrossOrgansLayout'
import { VisualizationsProvider } from '@/context/VisualizationsContext'
import ChartContainer from '../visualizations/ChartContainer'
import { formatNum, getUBKGFullName, percentage } from '../js/functions'
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

  const onSetToolTipContent = (ops) => {
      let total = 0
      let current = 0
      let currentGroup = ops.d?.data?.group
      for (let d of visualizationData) {
          if (d.group === currentGroup) {
              for (let c in d) {
                  if (c !=='group') {
                      total += d[c]
                  }
                  if (c === ops.label) {
                      current = d[c]
                  }
              }
          }
      }
      const label = ops.label


      
      const html = `<div">
      <span class="fs-6"><em>${label}</em>: <strong>${ops.value} (${percentage(ops.value, total)}%)</strong></span>
      <span><em>Other cell types</em>: <strong>${formatNum(total - current)} (${percentage(total - current, total)}%)</strong></span>
      <span><em>Total</em>: <strong>${formatNum(total)}</strong></span>
      </div>`
      
      ops.tooltip.getD3(ops.id)
          .style('left', ops.xPos + 'px')
          .style('top', ops.yPos - 20 + 'px')
          .attr('class', 'c-visualizations__tooltip c-visualizations__tooltip--multiLine')
          .html(html) 
  }

  const onRectClick = (eventData) => {
    Addon.log('onBarClick', { data: eventData })
    window.location = `/cell-types/${cell.cellIds[eventData.d.key]}`
  }

  const visualizationData = prepareStackedData(tabData[organ._id].data, false)

  return (
    <div>
      <div>The bar below shows the distribution of cell types in the {organ.label} tissue. The distribution is based on the number of cells annotated in SenNet datasets.</div>
      <VisualizationsProvider options={{onRectClick, onSetToolTipContent}}>
        <ChartContainer
          setLegend={setLegend}
          chartId={organ._id}
          data={visualizationData}
          xAxis={getAxis()} yAxis={getAxis()}
          style={{
            className: 'c-visualizations--noAxis c-visualizations--posInherit c-visualizations--boxShadow c-visualizations--tooltipHasArrow',
            hideViewbox: true, highlight: cell.label,
            transform: 'translate(0, 30)',
            margin: {bottom: 5},
            key: organ._id,
            height: 70, 
            colorScheme: d3.schemeTableau10,
            //colorScale
          }}
          chartType={'horizontalDistributionBar'} />

          <CellTypeDistributionAcrossOrgansLayout organ={organ} cell={cell} tabData={tabData} legend={legend}>
          </CellTypeDistributionAcrossOrgansLayout>
      </VisualizationsProvider>
      
    </div>
  )
})

export default CellTypeDistributionAcrossOrgansTab