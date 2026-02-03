import { fetchSearchAPIEntities } from '@/lib/services'
import { useEffect, useMemo, useState } from 'react'

/**
 * @typedef {Object} CellTypeDistributionAcrossOrgansProps
 * @property {string} clId - CL identifier to fetch distribution for (e.g. CL:0002394)
 * @property {string} organCode - Organ code to filter results (e.g. UBERON:0002168)
 * @property {number} [width=1000] - Overall width in px
 * @property {number} [height=28] - Height of the bar in px
 */

/**
 * Renders a stacked horizontal bar chart (distribution) from a list of segments.
 * Uses plain SVG (no d3 dependency). Each segment gets a native title for a tooltip.
 *
 * @param {CellTypeDistributionAcrossOrgansProps} props
 */
export default function CellTypeDistributionAcrossOrgans({
    clId,
    organCode,
    width = 1000,
    height = 28
}) {
    const margin = { left: 0, right: 0 }
    const innerWidth = Math.max(0, width - margin.left - margin.right)

    const [fetchedSegments, setFetchedSegments] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!clId) {
            setFetchedSegments(null)
            setLoading(false)
            setError(null)
            return
        }

        let cancelled = false
        const getData = async () => {
            setLoading(true)
            setError(null)
            const query = {
                bool: {
                    must: [
                        { term: { 'cl_id.keyword': { value: clId } } },
                        { term: { 'organ.code.keyword': { value: organCode } } }
                    ]
                }
            }

            const body = {
                size: 0,
                query,
                aggs: {
                    datasets: {
                        terms: {
                            field: 'dataset.sennet_id.keyword',
                            size: 1000
                        },
                        aggs: {
                            total_cells: { sum: { field: 'cell_count' } }
                        }
                    }
                }
            }

            try {
                const res = await fetchSearchAPIEntities(body, 'cell-types')
                if (cancelled) return

                const buckets = res?.aggregations?.datasets?.buckets || []

                // basic color palette to cycle through
                const palette = [
                    '#4a90e2',
                    '#7fc6b5',
                    '#2b7a78',
                    '#f2a65a',
                    '#b48ead',
                    '#6fa8dc',
                    '#f28b82',
                    '#a7c7e7'
                ]

                const segments = buckets.map((b, i) => ({
                    key: b.key,
                    label: b.key,
                    value: b.total_cells?.value ?? 0,
                    color: palette[i % palette.length]
                }))

                setFetchedSegments(segments)
            } catch (err) {
                if (!cancelled) setError(err)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        getData()

        return () => {
            cancelled = true
        }
    }, [clId, organCode])

    // prefer fetchedSegments when available
    const source = useMemo(() => fetchedSegments || [], [fetchedSegments])
    const _total = useMemo(() => source.reduce((s, d) => s + (d.value || 0), 0), [source])
    const total = _total || 0.000001

    // compute segments with cumulative offsets and widths in pixels (pure functional - no external mutation)
    const segments = useMemo(() => {
        const widths = source.map((d) => {
            const frac = (d.value || 0) / total
            return frac * innerWidth
        })

        const xs = widths.map((_, i) => widths.slice(0, i).reduce((s, v) => s + v, 0))

        return source.map((d, i) => ({
            key: d.key,
            label: d.label || d.key,
            value: d.value || 0,
            color: d.color || '#4a90e2',
            x: xs[i] || 0,
            width: widths[i] || 0
        }))
    }, [source, innerWidth, total])

    // accessibility: summarizing title text
    const title = `Distribution — ${source.length} segments, total ${Math.round(total)}`

    if (loading) return <div>Loading chart…</div>
    if (error && error.status === 404) return <div>{error.message}</div>
    if (error) return <div>Error loading chart</div>
    if (!fetchedSegments) return null

    return (
        <div style={{ width, maxWidth: '100%' }}>
            <svg
                width='100%'
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                role='img'
                aria-label={title}
            >
                <g transform={`translate(${margin.left},0)`}>
                    {segments.map((s, i) => {
                        // ensure tiny segments are at least 0.5px so they render
                        const w = Math.max(0.5, s.width)

                        return (
                            <g key={s.key}>
                                <rect
                                    x={s.x}
                                    y={0}
                                    width={w}
                                    height={height}
                                    fill={s.color}
                                    title={`${s.label}: ${s.value}`}
                                />
                            </g>
                        )
                    })}
                </g>
            </svg>
        </div>
    )
}
