import React, { useRef, useState, useEffect } from 'react'
import { Chip } from '@mui/material'
import { getUBKGFullName } from '../js/functions'
import { useSearchUIContext } from "search-ui/components/core/SearchUIContext";
import { parseJson } from '@/lib/services';

function SelectedFacets({searchContext}) {
    const { facetConfig, filters, setFilter, removeFilter, findFacet } = useSearchUIContext()
    const [staticChips, setStaticChips] = useState(null)

    const getSelector = (pre, label, value) => {
        return `sui-${pre}--${formatVal(label)}-${formatVal(value)}`
    }

    const formatVal = (id) => {
        return `${id}`.replace(/\W+/g, '')
    }

    const clearStaticFacet = (field) => {
        let esqFilter = parseJson(sessionStorage.getItem('esqFilter'))
        let esqFilterUpdated = []
        if (esqFilter && Array.isArray(esqFilter)) {
            for (let f of esqFilter) {
                for (let term in f.terms) {
                    if (term.replace('.keyword', '') === field) {
                        delete f.terms[term]
                    }
                }
               
            }
            for (let f of esqFilter) {
                if (Object.values(f.terms).length) {
                    esqFilterUpdated.push(f)
                }
            }
        }
        
        if (esqFilterUpdated.length) {
            sessionStorage.setItem('esqFilter', JSON.stringify(esqFilterUpdated))
        } else {
            sessionStorage.removeItem('esqFilter')
        }
        if (filters.length) {
            let _filter = filters[0]
            removeFilter(_filter.field, _filter.values[0])
            setFilter(_filter.field, _filter.values[0])
        }
        resolveStaticChips()
    }

    const getAllowedTermsForRoute = () => {
        if (searchContext === 'entities') {
            return ['sennet_id', 'uuid']
        }
        return []
    }

    const resolveStaticChips = () => {
        let allowedTermsForRoute = getAllowedTermsForRoute()
        if (!allowedTermsForRoute.length) return
        let staticChips = []
        let field
        let esqFilter = parseJson(sessionStorage.getItem('esqFilter'))
        if (esqFilter && Array.isArray(esqFilter)) {
            for (let f of esqFilter) {
                for (let term in f.terms) {
                    field = term.replace('.keyword', '').toLowerCase()
                    if (allowedTermsForRoute.contains(field)) {
                        staticChips.push(buildStaticFacetChip(field, f.terms[term].join(', ')))
                    }
                    
                }
            }
        }
        setStaticChips(staticChips)
    }

    useEffect(()=>{
        setTimeout(() => {
            resolveStaticChips()
        }, 300)
    }, [])

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

     const buildStaticFacetChip = (field, value) => {
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
                onDelete={(e) => clearStaticFacet(field)}
            />
        )
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

    return (
        <div className={`c-SelectedFacets`}>
            {filters.reduce((acc, filter) => {
                const facet = findFacet(filter.field)
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
                return acc
            }, [])}
            {staticChips}
        </div>
    )
}

export default SelectedFacets
