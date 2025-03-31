import React, {useEffect, useState} from 'react';
import {fetchEntity, getStatusColor} from "@/components/custom/js/functions";

const DerivedDatasetItem = ({index, data, dataType, descendantUuid}) => {

    const [descendantData, setDescendantData] = useState(null)


    useEffect(() => {
        const fetchData = async () => {
            await fetchEntity(descendantUuid).then((data) => {
                setDescendantData(data)
            });
        }

        fetchData()
    }, [])

    return (
        <>
            {descendantData != null &&
                <tr key={"descendant_data_" + index}>
                    <td>
                        <a href={`/dataset?uuid=${descendantData.uuid}`} className="icon_inline">
                            <span className="me-1">{descendantData.sennet_id}</span> <i className="bi bi-box-arrow-up-right"></i>
                        </a>
                    </td>
                    {(() => {
                        if (dataType === 'Dataset') {
                            return (
                                <>
                                    <td>
                                        {descendantData.dataset_type}
                                    </td>
                                    <td>
                                            <span className={`${getStatusColor(descendantData.status)} badge`}>
                                                {descendantData.status}
                                            </span>
                                    </td>
                                </>
                            )
                        } else if (dataType === 'Sample') {
                            return (
                                <>
                                    <td>{descendantData.organ}</td>
                                    <td>{descendantData.sample_category}</td>
                                </>
                            )
                        }
                    })()}

                    <td>{descendantData.descendant_counts?.entity_type?.Dataset || 0}</td>
                    <td>{new Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    }).format(descendantData.last_modified_timestamp)}</td>
                </tr>
            }
        </>
    )
};

export default DerivedDatasetItem
