import PropTypes from "prop-types"
import React, { memo } from 'react'
import Bar from './charts/Bar'
import OverlappedBar from './charts/OverlappedBar'
import GroupedBar from './charts/GroupedBar'
import StackedBar from './charts/StackedBar'
import HorizontalDistributionBar from './charts/HorizontalDistributionBar'
import { cls } from '@/components/custom/js/functions'

/***
 * @param {function} setLegend The react useState method for setting legend items
 * @param {array} data List to visualize [{group: 'x-axis label', groupLabel1: x, groupLabel2: y}, {group: 'x-axis label 2', groupLabel1: x, groupLabel2: y}]
 * @param {object} subGroupLabels A map of labels to use for groupLabels e.g. {groupLabel1: 'A Group Label', groupLabel2: 'Another Group Label'}
 * @param {string} chartId Imperative for multiple charts on same page.
 * @param {object} style {width, height, className}
 * @param {object} xAxis {formatter: function(v) for formatting axis ticks, label: string, showLabels: bool}
 * @param {object} yAxis {scaleLog: bool, ticks: int, label: string, showLabels: bool, showGrid: bool}
 * @param {string} containerClassName Additional classes for the container div
 */
const ChartContainer = memo(({children, containerClassName, ...otherProps}) => {
  const charts = {
    bar: Bar,
    groupedBar: GroupedBar,
    stackedBar: StackedBar,
    overlapBar: OverlappedBar,
    horizontalDistributionBar: HorizontalDistributionBar
  }
  const DisplayChart = charts[otherProps.chartType]
  if (!DisplayChart) return <>Invalid chart</>
  return (
    <div className={cls('c-visualizations', containerClassName)}>
      <DisplayChart {...otherProps} />
      {children}
    </div>
  )
});

ChartContainer.propTypes = {
  children: PropTypes.any,
  containerClassName: PropTypes.string
}

ChartContainer.displayName = 'ChartContainer';

export default ChartContainer