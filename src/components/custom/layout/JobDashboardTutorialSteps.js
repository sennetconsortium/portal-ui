import React from "react";
import Button from 'react-bootstrap/Button';
import {getJobTypeColor, getStatusColor} from "@/components/custom/js/functions";
function JobDashboardTutorialSteps({getVariant, data}) {
    const hasData = Array.isArray(data) && data.length
    const actionUI = (action) => `<input type="button" class='btn btn-sm btn-${getVariant(action)}  mx-1' value="${action}"/>`
    const statusUI = (status) => `<span class='badge ${getStatusColor(status)}'>${status}</span>`
    let _steps = [
        {
            element: '#nav-dropdown, #nav-dropdown--bulkMetadata',
            popover: {
                title: "Initiate a job",
                description: "<span>Jobs can be initiated by clicking the links under <em>Register entity (Bulk)</em> or <em>Upload metadata</em> and following the steps provided by the wizard.</span>"
            }
        },
        {
            element: '.refresh-jobs',
            popover: {
                title: "Refresh job list",
                description: "<div>The job dashboard is automatically refreshed every 3 seconds, however, it can be manually " +
                    "updated by clicking the <em>Refresh</em> button.</div>"
            }
        },
        {
            element: '.rdt_Table',
            popover: {
                title: "Job Types",
                description: `<div style=whiteSpace: 'pre-wrap'>Jobs can fall under two primary ` +
                    `categories: <code>validation</code> and <code>registration</code>. A <code>validation</code> job ` +
                    `checks that the submitted file meets specification standards while a <code>registration</code> job parses ` +
                    `the file and submits the relevant information.` +
                    `<br/><br/>` +
                    `These two categories are further distinguished by the subject of the uploaded file: entity ` +
                    `registration and metadata upload. ` +
                    `This is visible in the table under the <em>Type</em> column as either&nbsp; ` +
                    `<span class='badge badge-block' ` +
                    `style='background-color: ${getJobTypeColor('Metadata validation')}'>Metadata validation/registration</span> or&nbsp; ` +
                    `<span class='badge badge-block' ` +
                    `style='background-color: ${getJobTypeColor('Entity validation')}'>Entity validation/registration</span>` +
                    `</div>`
            }
        },
        {
            element: '.rdt_Table',
            disableBeacon: true,
            popover: {
                title: "Job Actions",
                description: `<div>Depending on the status of a particular job, different actions can be taken via` +
                    `the <em>Action</em> column in the jobs table. These actions include` +
                    `${actionUI('Register')} ${actionUI('Resubmit')} ${actionUI('Cancel')} and ${actionUI('Delete')}.` +
                    `<div class='mt-4 list-group'>` +
                    `<div class='list-group-item'>${actionUI('Register')} - continue to register the file after ` +
                    `a <code>validation</code> job has been successful with the status of ${statusUI('Complete')}` +
                    `</div>` +
                    `<div class='list-group-item'>${actionUI('Resubmit')} - resubmit the file when a <code>validation</code> job ` +
                    `has the status of either ${statusUI('Failed')} or ${statusUI('Error')}</div>` +
                    `<div class='list-group-item'>${actionUI('Cancel')} - stops a currently running ` +
                    `or ${statusUI('Started')} job</div>` +
                    `<div class='list-group-item'>${actionUI('Delete')} - removes the job from the dashboard</div>` +
                    `</div>` +
                    `</div>`
            }
        },

    ]
    if (hasData) {
        _steps.push(
            {
                element: '.sui-columns-toggle',
                popover: {
                    title: "Show/Hide Columns In Table",
                    description: 'Columns can be hidden from the job dashboard by clicking on the dropdown menu and selecting which columns to hide. To add these columns back to the job dashboard, click on the ‘x’ next to the column name.'
                }
            }
        )

        _steps.push(
            {
                element: '.btn-illusion-secondary',
                popover: {
                    title: "Color code linked jobs",
                    description: `<div><code>Validation</code> and <code>registration</code> jobs related to the same file ` +
                        `are linked. Toggling <em>Color code linked jobs</em> will highlight this relationship by adding a ` +
                        `unique background color to each set of jobs. From the job dashboard these linked jobs can be sorted by ` +
                        `clicking the color wheel <span class='color-wheel' style='display: inline-block'></span> icon.</div>`
                }
            }
        )

    }
    return _steps
}

export default JobDashboardTutorialSteps