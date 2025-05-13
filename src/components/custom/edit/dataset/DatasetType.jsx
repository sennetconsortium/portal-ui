import React from 'react';
import {Form} from 'react-bootstrap';
import SenNetPopover from "../../../SenNetPopover";
import {eq, getUBKGFullName} from "../../js/functions";

export default function DatasetType({datasetTypes, data, label, labelDescription, dataValue, onChange}) {
    return (
        //Data Types
        <>
            <Form.Group className="mb-3" controlId={dataValue ? dataValue : "dataset_type"}>
                <Form.Label>{label ? label : `Dataset Type` }<span
                    className="required">* </span>
                    <SenNetPopover className={dataValue ? dataValue : 'dataset_type'}
                                   text={labelDescription ? labelDescription : <>The type of data contained in
                                       this <code>Dataset</code>. Choose from one
                                       of the available options.</>}>
                        <i className={'bi bi-question-circle-fill'}></i>
                    </SenNetPopover>
                </Form.Label>

                {/*Check that there exists a data type for this dataset and if it is not a part of the list of primary assay types*/}
                {(data?.dataset_category && data.dataset_category !== 'primary') || eq(data['status'], 'Published') ?
                    (
                        <Form.Select required aria-label={label ? label : `Dataset Type`} disabled>
                            <option
                                value={data.dataset_type}>{getUBKGFullName(dataValue ? data[dataValue] : data.dataset_type)}</option>
                        </Form.Select>
                    ) : (
                        <Form.Select required aria-label={label ? label : `Dataset Type`}
                                     onChange={(e) => onChange(e, dataValue ? dataValue : 'dataset_type', e.target.value)}
                                     name={dataValue ? dataValue : 'dataset_type'}
                                     defaultValue={dataValue ? data?.[dataValue] : data?.dataset_type}>
                            <option value="">----</option>
                            {datasetTypes.sort().map(data_type => {
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