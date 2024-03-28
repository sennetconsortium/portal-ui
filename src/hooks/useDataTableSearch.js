import React, {useEffect, useState, useMemo} from 'react'

import {Button, Form, InputGroup, Col, Row} from 'react-bootstrap'

const FilterComponent = ({ filterText, onFilter, onClear, className, onKeydown }) => (
    <>
        <Form.Group className={`sui-filterableComponent ${className}`} as={Col}>
            <InputGroup>
                <Form.Control onChange={onFilter} onKeyDown={onKeydown} value={filterText} />
                <InputGroup.Text className={"transparent"}><i className="bi bi-search"></i></InputGroup.Text>
                <Button type="button" onClick={onClear} label={'Reset'}><i className="bi bi-x"></i></Button>
            </InputGroup>
        </Form.Group>
    </>
);

function useDataTableSearch({data, onKeydown, fieldsToSearch = [], className = ''}) {
    useEffect(() => {
    }, [])

    const [filterText, setFilterText] = useState('');
    const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
    const filteredItems = () => {
        let results = []
        for (let searchIndex of fieldsToSearch) {
            for (let d of data) {
                if (d[searchIndex] && d[searchIndex]?.toLowerCase().includes(filterText?.toLowerCase())) {
                    if (results.indexOf(d) === -1) results.push(d);
                }
            }
        }
        return results;
    }
    const searchBarComponent = useMemo(() => {
        const handleClear = () => {
            if (filterText) {
                setResetPaginationToggle(!resetPaginationToggle)
                setFilterText('')
                const params = new URLSearchParams(window.location.search)
                if (params.get('q')) {
                    params.delete('q')
                    const query = params.toString()
                    window.history.pushState(null, null, `${query.length ? `?${query}` : window.location.pathname}`)
                }
            }
        };

        return (
            <FilterComponent onFilter={e => setFilterText(e.target.value)} onClear={handleClear} filterText={filterText} className={className} onKeydown={onKeydown} />
        );
    }, [filterText, resetPaginationToggle]);

    return {filteredItems: filteredItems(), filterText, setFilterText, searchBarComponent}
}


export default useDataTableSearch