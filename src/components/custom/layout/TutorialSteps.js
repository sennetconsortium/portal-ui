import {eq} from "@/components/custom/js/functions";

function TutorialSteps(loggedIn, name = "app") {
    const downloadText = "<span>Clicking on the checkboxes <input type={'checkbox'} role='presentation' disabled/> on the left side of the search results table allows selecting distinct entities for export. Clicking on the download icon <i class='bi bi-download text-primary fs-5'></i> at the top of the search results table allows for exporting either only the selected entities or all entities in the table to a <code>JSON</code> or <code>TSV</code> format.</span>"
    if (eq(name, "searchActions")) {
        return [
            {
                element: '#sui-search-actions-btn',
                popover: {
                    title: `Download Search Results (1/2)`,
                    description: downloadText
                }
            },
            {
                element: '#sui-search-actions-btn',
                popover: {
                    title: `Compare Dataset Visualizations (2/2)`,
                    description: 'You may select up to four primary datasets by clicking on the checkboxes on the left side of the search results table. Clicking on "Compare Datasets" will allow you to compare the visualizations for each dataset side by side. '
                }
            },
        ]
    }
    let _steps = [
        {
            element: '#search',
            popover: {
                title: `Search Entities by Free Text`,
                description: 'To further narrow the relevant entities, type search terms or phrases into the Search bar. Entities containing any of the search terms will be returned.'

            }
        },
        // {
        //     element: '#searchDropdown',
        //     title: `Search Entities or Metadata (2/${stepsCount})`,
        //     description: 'The default option to search by entities allows you to filter results based on the core properties of various entity types. You can also search and filter the metadata that has been submitted to registered entities.',
        // },
        {
            element: '.sui-facet',
            popover: {
                title: `Filter Your Browsing`,
                description: 'The faceted search options on the left side allows filtering entities by any combination of categories. Search results update automatically as you edit the selection of filters.',
            }
        },
        {
            element: '[data-column-id="sennet_id"].rdt_TableCol',
            popover: {
                title: `Sort Search Results`,
                description: 'Clicking the header of any column will sort search results. A bolded arrow indicates the current sorting selection. Clicking again will reverse the order.'
            }
        },
        {
            element: '[data-column-id="sennet_id"].rdt_TableCol',
            popover: {
                title: `Reorder Columns`,
                description: "<span>Column headers can be reorganized by clicking and dragging. When exporting the results table, the <code>TSV</code> that is generated will mirror the column order.</span>"
            }
        },
        {
            element: '.sui-columns-toggle',
            popover: {
                title: `Show/Hide Columns In Table`,
                description: 'Columns can be hidden from the results table by clicking on the dropdown menu and selecting which columns to hide. To add these columns back to the results table, click on the ‘x’ next to the column name.'
            }
        },
        {
            element: '.c-searchActions',
            popover: {
                title: `Download Search Results`,
                description: downloadText
            }
        }
    ]
    if (loggedIn) {
        _steps.push({
            element: '#nav-dropdown',
            popover: {
                title: `Registering entities`,
                description:
                    "<span>You may register individual and bulk entities by clicking on this menu. Then selecting under <i>Single</i> for single registration or under <i>Bulk</i> for bulk registration.</span>"
            }
        })

        _steps.push({
            element: '#nav-dropdown--upload-metadata',
            popover: {
                title: `Bulk uploading metadata`,
                description: "<span>Select this menu to bulk upload metadata. <br/> <small class='text-muted'>Note: You may also upload metadata for a single entity during registration. See previous step for details.</small>"
            }
        })
    }
    return _steps
}

export default TutorialSteps