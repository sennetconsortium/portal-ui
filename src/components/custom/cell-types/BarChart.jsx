import React from 'react'

/**
 * @typedef {Object} BarDataItem
 * @property {string} organ - Organ name (e.g. 'Kidney').
 * @property {number} count - Cell count for the organ.
 */

/**
 * @typedef {Object} BarChartProps
 * @property {BarDataItem[]} [data] - Array of data items to plot.
 * @property {number} [width] - Overall chart width.
 * @property {number} [height] - Overall chart height.
 */

/**
 * BarChart component: renders a simple SVG bar chart.
 *
 * @param {BarChartProps} props
 * @returns {JSX.Element}
 */
function BarChart({ data, width = 600, height = 300 }) {
    const margin = { top: 20, right: 20, bottom: 50, left: 100 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const maxCount = Math.max(...data.map((d) => d.count), 1)
    const gap = innerWidth / data.length
    const barWidth = gap * 0.6

    const yTicks = 5
    const ticks = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxCount * i) / yTicks))

    return (
        <div style={{ width, maxWidth: '100%', paddingBottom: '1rem' }}>
            <svg
                width='100%'
                viewBox={`0 0 ${width} ${height}`}
                role='img'
                aria-label='Organ cell count bar chart'
                style={{ overflow: 'visible' }}
            >
                {/* y axis ticks and labels */}
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                    {ticks.map((t, i) => {
                        const y = innerHeight - (t / maxCount) * innerHeight
                        return (
                            <g key={i}>
                                <line
                                    x1={0}
                                    x2={innerWidth}
                                    y1={y}
                                    y2={y}
                                    stroke='#e6e6e6'
                                    strokeWidth={1}
                                />
                                <text x={-8} y={y + 4} fontSize={12} textAnchor='end' fill='#333'>
                                    {t}
                                </text>
                            </g>
                        )
                    })}

                    {/* axes lines */}
                    <line x1={0} x2={0} y1={0} y2={innerHeight} stroke='#333' strokeWidth={1.5} />
                    <line
                        x1={0}
                        x2={innerWidth}
                        y1={innerHeight}
                        y2={innerHeight}
                        stroke='#333'
                        strokeWidth={1.5}
                    />

                    {/* bars */}
                    {data.map((d, i) => {
                        const x = i * gap + (gap - barWidth) / 2
                        const barHeight = (d.count / maxCount) * innerHeight
                        const y = innerHeight - barHeight
                        return (
                            <g key={d.organ}>
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    fill='#4a90e2'
                                    rx={3}
                                />
                                <text
                                    x={x + barWidth / 2}
                                    y={y - 6}
                                    fontSize={12}
                                    textAnchor='middle'
                                    fill='#111'
                                >
                                    {d.count}
                                </text>
                                <text
                                    x={x + barWidth / 2}
                                    y={innerHeight + 20}
                                    fontSize={12}
                                    textAnchor='middle'
                                    fill='#111'
                                >
                                    {d.organ}
                                </text>
                            </g>
                        )
                    })}

                    {/* axes labels */}
                    <text
                        transform={`translate(${-30}, ${innerHeight / 2}) rotate(-90)`}
                        fontSize={12}
                        fill='#111'
                        textAnchor='middle'
                        fontWeight='bold'
                    >
                        Cell Count
                    </text>
                    <text
                        x={innerWidth / 2}
                        y={innerHeight + 40}
                        fontSize={12}
                        textAnchor='middle'
                        fill='#111'
                        fontWeight='bold'
                    >
                        Organ
                    </text>
                </g>
            </svg>
        </div>
    )
}

export default BarChart
