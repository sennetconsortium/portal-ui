import React from "react";

function TutorialSteps(loggedIn) {
    const stepsCount = loggedIn ? 8 : 6
    let _steps = [
        {
            target: '#search',
            disableBeacon: true,
            title: <span>Search Entities by Free Text (1/{stepsCount})</span>,
            content: 'To further narrow the relevant entities, type search terms or phrases into the Search bar. Entities containing any of the search terms will be returned.'
        },
        // {
        //     target: '#searchDropdown',
        //     title: <span>Search Entities or Metadata (2/{stepsCount})</span>,
        //     content: 'The default option to search by entities allows you to filter results based on the core properties of various entity types. You can also search and filter the metadata that has been submitted to registered entities.',
        // },
        {
            target: '.sui-facet',
            title: <span>Filter Your Browsing (2/{stepsCount})</span>,
            content: 'The faceted search options on the left side allows filtering entities by any combination of categories. Search results update automatically as you edit the selection of filters.',
        },
        {
            target: '[data-column-id="sennet_id"].rdt_TableCol',
            title: <span>Sort Search Results (3/{stepsCount})</span>,
            content: 'Clicking the header of any column will sort search results. A bolded arrow indicates the current sorting selection. Clicking again will reverse the order.'
        },
        {
            target: '[data-column-id="sennet_id"].rdt_TableCol',
            title: <span>Reorder Columns (4/{stepsCount})</span>,
            content: <span>Column headers can be reorganized by clicking and dragging. When exporting the results table, the <code>TSV</code> that is generated will mirror the column order.</span>
        },
        {
            target: '.sui-columns-toggle',
            title: <span>Show/Hide Columns In Table (5/{stepsCount})</span>,
            content: 'Columns can be hidden from the results table by clicking on the dropdown menu and selecting which columns to hide. To add these columns back to the results table, click on the ‘x’ next to the column name.'
        },
        {
            target: '#sui-tbl-checkbox-actions',
            title: <span>Download Search Results (6/{stepsCount})</span>,
            content: <span>Clicking on the checkboxes <input type={'checkbox'} role='presentation' disabled/> on the left side of the search results table allows selecting distinct entities for export. Clicking on the download icon <i
                className="bi bi-download text-primary fs-5"></i> at the top of the search results table allows for exporting either only the selected entities or all entities in the table to a <code>JSON</code> or <code>TSV</code> format.</span>
        }
    ]
    if (loggedIn) {
        _steps.push({
            target: '#nav-dropdown',
            title: <span>Registering entities (7/{stepsCount})</span>,
            content:
                <span>You may register individual and bulk entities by clicking on this menu. Then selecting under <i>Single</i> for single registration or under <i>Bulk</i> for bulk registration.</span>
        })

        _steps.push({
            target: '#nav-dropdown--upload-metadata',
            title: <span>Bulk uploading metadata (8/{stepsCount})</span>,
            content: <span>Select this menu to bulk upload metadata. <br/> <small className='text-muted'>Note: You may also upload metadata for a single entity during registration. See previous step for details.</small></span>
        })
    }
    return _steps
}

export default TutorialSteps