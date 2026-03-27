import { VisualizationsProvider } from '@/context/VisualizationsContext'
import React, { useContext, useRef, useState } from 'react'
import useSearchUIQuery from '@/hooks/useSearchUIQuery'
import { getEntitiesIndex } from '@/config/config'
import { SEARCH_ENTITIES } from '@/config/search/entities'
import StackedBar from '../visualizations/charts/StackedBar'
import AppContext from '@/context/AppContext'
import { Skeleton } from '@mui/material'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import VizLegend from '../visualizations/VizLegend'

function DataTypeQuantitiesChart({ organ }) {
  const [legend, setLegend] = useState({})

  const mustNot = SEARCH_ENTITIES.searchQuery.excludeFilters.map((filter) => {
    switch (filter.type) {
      case 'term':
        return { terms: { [filter.field]: filter.values } };
      case 'exists':
        return { exists: { field: filter.field } };
    }
  })

  const query = {
    size: 0,
    query: {
      bool: {
        must: [
          {
            terms: {
              'origin_samples.organ.keyword': organ.codes,
            }
          },
          {
            term: {
              "entity_type.keyword": "Dataset"
            }
          }
        ],
        must_not: mustNot
      }
    },
    aggs: {
      by_dataset_type: {
        terms: {
          field: "dataset_type_hierarchy.first_level.keyword",
          size: 1000
        },
        aggs: {
          by_organ_code: {
            "terms": {
              "field": "origin_samples.organ.keyword",
              "size": 100
            },
          },
        }
      }
    }
  }

  const { data, loading, error } = useSearchUIQuery(getEntitiesIndex(), query)
  const { cache } = useContext(AppContext)

  const subGroupLabels = useRef({})

  const getBarData = () => {
    const _data = []
    let maxY = 0
    let organCodes, count
    for (const d of data.aggregations.by_dataset_type.buckets) {
      organCodes = {}
      count = 0
      for (const o of d.by_organ_code.buckets) {
        if (organ.codes.indexOf(o.key) !== -1) {
          organCodes[o.key] = o.doc_count
          count += o.doc_count
          subGroupLabels.current[o.key] = cache.organTypes[o.key]
        }
      }
      _data.push({ ...organCodes, group: d.key, total: d.doc_count })
      maxY = Math.max(count, maxY)
    }
    return { data: _data, ticks: Math.min(10, maxY) }
  }
  const barData = data ? getBarData() : null
  if (!barData || loading) {
    return <Skeleton variant='rounded' />
  }
  return (
    <Row>
      <Col sm={10}>
        <div>
          <VisualizationsProvider>
            <StackedBar data={barData?.data} setLegend={setLegend} subGroupLabels={subGroupLabels.current} style={{ className: 'mp-3' }} xAxis={{ label: 'Dataset Type' }} yAxis={{ label: 'Count', ticks: barData?.ticks }} />
          </VisualizationsProvider>
        </div>
      </Col>
      <Col sm={2}>
        <VizLegend legend={legend} legendToolTip={null} />
      </Col>
    </Row>
  )
}

export default DataTypeQuantitiesChart