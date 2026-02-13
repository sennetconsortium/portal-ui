import { Chip } from '@mui/material'
import { getUBKGFullName } from '../js/functions'
import { useSearchUIContext } from "search-ui/components/core/SearchUIContext";

function SelectedFacets() {
    const { facetConfig, filters, setFilter, removeFilter, findFacet } = useSearchUIContext()

    const getSelector = (pre, label, value) => {
        return `sui-${pre}--${formatVal(label)}-${formatVal(value)}`
    }

    const formatVal = (id) => {
        return `${id}`.replace(/\W+/g, '')
    }

    const convertToDisplayLabel = (facet, key) => {
        switch (facet.facetType) {
            case 'daterange':
                const datePrefix = key === 'from' ? 'Start' : 'End'
                return `${datePrefix} ${facet.label}`
            case 'histogram':
                const numPrefix = key === 'from' ? 'Min' : 'Max'
                return `${numPrefix} ${facet.label}`
            default:
                return facet.label
        }
    }

    const convertToDisplayValue = (facet, value) => {
        switch (facet.facetType) {
            case 'daterange':
                return new Date(value).toLocaleDateString('en-US', { timeZone: 'UTC' })
            case 'histogram':
                return value
            default:
                if (!facet.transformFunction) {
                    return getUBKGFullName(value)
                }
                return facet.transformFunction(value)
        }
    }

    const handleDelete = (e, filter, facet, value, key) => {
        e.preventDefault()
        switch (facet.facetType) {
            case 'daterange':
            case 'histogram':
                const newValue = { ...value }
                delete newValue[key]
                if (!newValue.from && !newValue.to) {
                    removeFilter(filter.field, value)
                } else {
                    setFilter(filter.field, newValue)
                }
                break;
            default:
                removeFilter(filter.field, value)
                break;
        }
    }

    const buildRangeFacetChip = (filter, facet, value) => {
        const chips = []
        Array('from', 'to').forEach((key) => {
            if (!value[key])
                return

            chips.push(
                <Chip
                    key={`${filter.field}_${key}`}
                    className={`${getSelector('chipToggle', filter.field, key)}`}
                    label={
                        <>
                            {' '}
                            <span className='chip-title'>{convertToDisplayLabel(facet, key)}</span>:{' '}
                            {convertToDisplayValue(facet, value[key])}
                        </>
                    }
                    variant='outlined'
                    onDelete={(e) => handleDelete(e, filter, facet, value, key)}
                />
            )
        })
        return chips
    }

    const buildValueFacetChip = (filter, facet, value) => {
        return (
            <Chip
                key={`${filter.field}_${formatVal(value)}`}
                className={`${getSelector('chipToggle', filter.field, value)}`}
                label={
                    <>
                        {' '}
                        <span className='chip-title'>{convertToDisplayLabel(facet)}</span>:{' '}
                        {convertToDisplayValue(facet, value)}
                    </>
                }
                variant='outlined'
                onDelete={(e) => handleDelete(e, filter, facet, value)}
            />
        )
    }

    const buildListValuesFacetChip = (filter) => {
        const field = filter.field 
        const value = filter.values.join(', ')
        return (
            <Chip
                key={`${field}_${formatVal(value)}`}
                className={`${getSelector('chipToggle', field, value)} sui-chipToggle--static`}
                label={
                    <>
                        {' '}
                        <span className='chip-title'>{field}</span>:{' '}
                        <span className='chip-value'>{value}</span>
                    </>
                }
                variant='outlined'
                onDelete={(e) => filter.values.map(v => removeFilter(field, v))}
            />
        )
    }

    return (
        <div className={`c-SelectedFacets`}>
            {filters.reduce((acc, filter) => {
                const facet = findFacet(filter.field)
                if (facet?.facetChipType) {
                    acc.push(buildListValuesFacetChip(filter))
                } else {
                    for (const value of filter.values) {
                        switch (facet?.facetType) {
                            case 'daterange':
                            case 'histogram':
                                acc.push(...buildRangeFacetChip(filter, facet, value))
                                break;
                            default:
                                acc.push(buildValueFacetChip(filter, facet, value))
                                break;
                        }
                    }
                }
                
                return acc
            }, [])}
        </div>
    )
}

export default SelectedFacets