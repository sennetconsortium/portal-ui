import React, { useEffect, useState } from 'react'
import VizLegend from '@/components/custom/visualizations/VizLegend'
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { formatNum} from '../js/functions'

/**
 * @param {object} organ The current organ
 * @param {object} tabData Data of the current tab {[organ.code]: {data, cells, types}}
 * @param {object} cell The current cell {id, label}
 * @param {object} legend Legend group names and color {label: {color, label, value}}
 */
function CellTypeDistributionAcrossOrgansLayout({ children, organ, tabData, cell, legend}) {
  const [_, setRefresh] = useState(null)

  useEffect(() => {
    setRefresh(new Date().getTime())
  }, [tabData])

  return (
    <div>
      {children}
      <p>Indexed Lung datasets contain {formatNum(tabData[organ.code].cells)} cells in {formatNum(tabData[organ.code].types)} cell types.</p>
      <Row>
        <Col>
          <h3 className='fs-6'>Targeted Cell Type</h3>
          <p><span className='badge badge-info fs-6'>{cell.label}</span> <code>{tabData[organ.code].currentCell}</code> cells, <code> {(tabData[organ.code].currentCell / tabData[organ.code].cells * 100).toFixed(2)}%</code> of total</p>
        </Col>
        <Col>
          <h3 className='fs-6'>Other Cell Types</h3>
          <VizLegend legendId={organ.code} legend={legend} />
        </Col>
      </Row>
    </div>
  )
}

export default CellTypeDistributionAcrossOrgansLayout