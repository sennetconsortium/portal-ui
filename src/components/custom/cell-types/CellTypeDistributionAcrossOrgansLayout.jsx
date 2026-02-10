import React, { useContext, useEffect, useState, memo } from 'react'
import VizLegend from '@/components/custom/visualizations/VizLegend'
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { formatNum, percentage} from '../js/functions'
import VisualizationsContext from '@/context/VisualizationsContext';

/**
 * @param {object} organ The current organ
 * @param {object} tabData Data of the current tab {[organ._id]: {data, cells, types}}
 * @param {object} cell The current cell {id, label}
 * @param {object} legend Legend group names and color {label: {color, label, value}}
 */
const CellTypeDistributionAcrossOrgansLayout = memo(({ children, organ, tabData, cell, legend}) => {
  const [_, setRefresh] = useState(null)

  const {toolTipHandlers, setToolTipContent, getChartSelector} = useContext(VisualizationsContext)

  useEffect(() => {
    setRefresh(new Date().getTime())
  }, [tabData])

  
  const onLegendItemClick = (_cell) => {
    if (cell.cellIds[_cell.label]) {
      window.location = `/cell-types/${cell.cellIds[_cell.label]}`
    }
  }

  const onLegendItemHover = (_cell) => {
    const chartType = 'horizontalDistributionBar'
    const $el = $(`${getChartSelector(organ._id, chartType)} .bar--${_cell.label.toDashedCase()}`)

    setToolTipContent({id: organ._id, label: _cell.label, d: {data: {group: organ.label}}, value: _cell.value, xPos: $el.attr('x'), yPos: 0}).style('opacity', 1)

  }

  const handleLabelValueFormatter = (_cell) => {
    return <><code>{_cell.value}</code> cells, <code>{percentage(_cell.value, tabData[organ._id].cells)}</code>% of total </>
  }

  return (
    <div>
      {children}
      <p>Indexed {organ.label} datasets contain {formatNum(tabData[organ._id].cells)} cells in {formatNum(tabData[organ._id].types)} cell types.</p>
      <Row>
        <Col>
          <h3 className='fs-6'>Targeted Cell Type</h3>
          <p><span className='badge badge-info fs-6'>{cell.label}</span> &nbsp;
          <code>{tabData[organ._id].currentCell}</code> cells,&nbsp;
          <code> {percentage(tabData[organ._id].currentCell, tabData[organ._id].cells)}%</code> of total</p>
        </Col>
        <Col>
          
          <VizLegend title={<h3 className='fs-6'>Other Cell Types</h3>} legendToolTip={'Clicking on a legend item redirects to the specific cell type page.'} isFilterable={true} onItemHover={onLegendItemHover} labelValueFormatter={handleLabelValueFormatter} excludedValues={[cell.label]} legendId={organ._id} legend={legend} onItemClick={onLegendItemClick} />
        </Col>
      </Row>
    </div>
  )
})

export default CellTypeDistributionAcrossOrgansLayout