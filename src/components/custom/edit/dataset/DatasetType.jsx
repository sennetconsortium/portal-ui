import React from 'react';
import {Col, Form, Row} from 'react-bootstrap';
import SenNetPopover from "../../../SenNetPopover";
import {getUBKGFullName} from "../../js/functions";

export default function DatasetType({datasetTypes, data, onChange}) {

    return (
        //Data Types
        <>
            <Form.Group className="mb-3" controlId="dataset_type">
                <Form.Label>Dataset Type <span
                    className="required">* </span>
                    <SenNetPopover className={'dataset_type'}
                                   text={<>The type of data contained in this <code>Dataset</code>. Choose from one
                                       of the available options.</>}>
                        <i className={'bi bi-question-circle-fill'}></i>
                    </SenNetPopover>
                </Form.Label>

                {/*Check that there exists a data type for this dataset and if it is not a part of the list of primary assay types*/}
                {data?.dataset_category && data.dataset_category !== 'primary' ?
                    (
                        <Form.Select required aria-label="Dataset Type" disabled>
                            <option
                                value={data.dataset_type}>{getUBKGFullName(data.dataset_type)}</option>
                        </Form.Select>
                    ) : (
                        <Form.Select required aria-label="Dataset Type"
                                     onChange={(e) => onChange(e, 'dataset_type', e.target.value)}
                                     name={'dataset_type'}
                                     defaultValue={data?.dataset_type}>
                            <option value="">----</option>
                            {datasetTypes.map(data_type => {
                                return (
                                    <option key={data_type} value={data_type.trim()}>
                                        {getUBKGFullName(data_type)}
                                    </option>
                                );
                            })}
                        </Form.Select>
                    )}

            </Form.Group>
        </>
    )

}