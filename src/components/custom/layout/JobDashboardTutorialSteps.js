import React from "react";
import {getJobTypeColor, getStatusColor} from "../js/functions";
import {Button, ListGroup} from "react-bootstrap";

function JobDashboardTutorialSteps({getVariant, data}) {
    const hasData = Array.isArray(data) && data.length
    const stepsCount = hasData ? 6 : 4
    const actionUI = (action) => <Button key={action} variant={getVariant(action)} className={'mx-1'} size="sm">{action}</Button>
    const statusUI = (status) => <span className={`badge ${getStatusColor(status)}`}>{status}</span>
    let _steps = [
        {
            target: '#nav-dropdown, #nav-dropdown--bulkMetadata',
            disableBeacon: true,
            title: <span>Initiate a job (1/{stepsCount})</span>,
            content: <span>Jobs can be initiated by clicking the links under <em>Register entity (Bulk)</em> or <em>Upload metadata</em> and following the steps provided by the wizard.</span>
        },
        {
            target: '.refresh-jobs',
            title: <span>Refresh job list (2/{stepsCount})</span>,
            content: <div>The job dashboard is automatically refreshed every 3 seconds, however, it can be manually updated by clicking the <em>Refresh</em> button.</div>
        },
        {
            target: '.rdt_Table',
            disableBeacon: true,
            title: <span>Job Types (3/{stepsCount})</span>,
            content: <div style={{whiteSpace: "pre-wrap"}}>Jobs can fall under two primary
                categories: <code>validation</code> and <code>registration</code>. A <code>validation</code> job checks
                that the submitted file meets specification standards while a <code>registration</code> job parses the
                file and submits the relevant information.
                <br/><br/>
                These two categories are further distinguished by the subject of the uploaded file: entity registration
                and metadata upload.
                This is visible in the table under the <em>Type</em> column as either&nbsp;
                <span className={`badge badge-block`} style={{backgroundColor: getJobTypeColor('Metadata validation')}}>Metadata validation/registration</span> or&nbsp;
                <span className={`badge badge-block`} style={{backgroundColor: getJobTypeColor('Entity validation')}}>Entity validation/registration</span>

            </div>
        },
        {
            target: '.rdt_Table',
            disableBeacon: true,
            title: <span>Job Actions (4/{stepsCount})</span>,
            content: <div>Depending on the status of a particular job, different actions can be taken via the <em>Action</em> column in the jobs table. These actions include
                {actionUI('Register')} {actionUI('Resubmit')} {actionUI('Cancel')} and {actionUI('Delete')}.
                <ListGroup className={'mt-4'}>
                    <ListGroup.Item>{actionUI('Register')} - continue to register the file after a <code>validation</code> job has been successful with the status of {statusUI('Complete')}</ListGroup.Item>
                    <ListGroup.Item>{actionUI('Resubmit')} - resubmit the file when a <code>validation</code> job has the status of either {statusUI('Failed')} or {statusUI('Error')}</ListGroup.Item>
                    <ListGroup.Item>{actionUI('Cancel')} - stops a currently running or {statusUI('Started')} job</ListGroup.Item>
                    <ListGroup.Item>{actionUI('Delete')} - removes the job from the dashboard</ListGroup.Item>
                </ListGroup>
            </div>
        },

    ]
    if (hasData) {
        _steps.push(
            {
                target: '.sui-columns-toggle',
                title: <span>Show/Hide Columns In Table (5/{stepsCount})</span>,
                content: 'Columns can be hidden from the job dashboard by clicking on the dropdown menu and selecting which columns to hide. To add these columns back to the job dashboard, click on the ‘x’ next to the column name.'
            }
        )

        _steps.push(
            {
                target: '.btn-illusion-secondary',
                title: <span>Color code linked jobs (6/{stepsCount})</span>,
                content: <div><code>Validation</code> and <code>registration</code> jobs related to the same file are
                    linked. Toggling <em>Color code linked jobs</em> will highlight this relationship by adding a unique
                    background color to each set of jobs. From the job dashboard these linked jobs can be sorted by
                    clicking the color wheel <span className={'color-wheel'}
                                                   style={{display: 'inline-block'}}></span> icon.</div>
            }
        )

    }
    return _steps
}

export default JobDashboardTutorialSteps