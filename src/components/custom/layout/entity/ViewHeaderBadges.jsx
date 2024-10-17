import ClipboardCopy from "@/components/ClipboardCopy";
import SenNetPopover from "@/components/SenNetPopover";
import StatusError from "@/components/StatusError";
import { APP_ROUTES } from "@/config/constants";
import { getOrganByCode } from "@/config/organs";
import AppContext from "@/context/AppContext";
import Link from "next/link";
import PropTypes from "prop-types";
import {Fragment, useContext, useEffect, useState} from "react";
import {
    getDatasetTypeDisplay,
    displayBodyHeader,
    eq,
    getStatusColor,
    getStatusDefinition,
    getUBKGFullName
} from "../../js/functions";

function ViewHeaderBadges({data, uniqueHeader, uniqueHeaderUrl, isMetadataHeader, hasWritePrivilege}) {
    const {cache} = useContext(AppContext)
    const [organs, setOrgans] = useState([])

    const getOrganRoute = (ruiCode) => {
        const organ = getOrganByCode(ruiCode)
        if (!organ) return
        return `${APP_ROUTES.organs}/${organ.path}`
    }

    useEffect(() => {
        let organs = new Set()
        if (data && data.origin_samples) {
            data.origin_samples.map(origin_sample => {
                organs.add(origin_sample.organ)
            })
            // Need to convert Set to Array
            setOrgans(Array.from(organs))
        }
    }, [data]);


    return (
        <Fragment>
            {isMetadataHeader ? (
                <Fragment>
                    <h5 className={"title_badge"}>
                        <a className={`badge bg-${data.entity_type.toLowerCase()} me-2`}
                           href={`/${data.entity_type.toLowerCase()}?uuid=${data.uuid}`}>{displayBodyHeader(data.sennet_id)}</a>
                    </h5>

                    {!eq(data.entity_type, cache.entities.dataset) ? (
                        <Fragment>
                            <h5 className={"title_badge"}>
                                <span className="badge bg-secondary me-2">
                                    {displayBodyHeader(data.entity_type)}
                                </span>
                            </h5>

                            {data.sample_category &&
                                <h5 className={"title_badge"}>
                                    <span className="badge bg-secondary me-2">
                                        {displayBodyHeader(data.sample_category)}
                                    </span>
                                </h5>
                            }

                            {data.source_type &&
                                <h5 className={"title_badge"}>
                                    <span className="badge bg-secondary me-2">
                                        {displayBodyHeader(data.source_type)}
                                    </span>
                                </h5>
                            }
                        </Fragment>
                    ) : (
                        <h5 className={"title_badge"}>
                            <span className="badge bg-secondary me-2">
                                    {getUBKGFullName(getDatasetTypeDisplay(data))}
                            </span>
                        </h5>
                    )
                    }
                </Fragment>) : (
                <Fragment>
                    {organs && organs.length > 0 &&
                        organs.map(organ => (
                            <Fragment key={organ}>
                                {/* Some organs don't have an organ page */}
                                {getOrganRoute(organ) ? (
                                    <a href={getOrganRoute(organ)}>
                                        <h5 className={"title_badge"}>
                                        <span className="badge bg-secondary me-2">
                                            {displayBodyHeader(getUBKGFullName(organ))}
                                        </span>
                                        </h5>
                                    </a>
                                ) : (
                                    <h5 className={"title_badge"}>
                                    <span className="badge bg-secondary me-2">
                                        {displayBodyHeader(getUBKGFullName(organ))}
                                    </span>
                                    </h5>
                                )}
                            </Fragment>
                        ))
                    }

                    {data.source_type &&
                        <h5 className={"title_badge"}>
                            <span className="badge bg-secondary me-2">
                                {displayBodyHeader(data.source_type)}
                            </span>
                        </h5>

                    }
                    {uniqueHeader && !uniqueHeaderUrl &&
                        <h5 className={"title_badge"}>
                            <span className="badge bg-secondary me-2">
                                {getUBKGFullName(uniqueHeader)}
                            </span>
                        </h5>
                    }
                    {uniqueHeader && uniqueHeaderUrl &&
                        <Link href={uniqueHeaderUrl}>
                            <h5 className={"title_badge"}>
                                <span className="badge bg-secondary me-2">
                                    {getUBKGFullName(uniqueHeader)}
                                </span>
                            </h5>
                        </Link>
                    }
                    {data.status &&
                        <h5 className={"title_badge"}>
                        <span className={`badge ${getStatusColor(data.status)} me-2`}>

                        {(data.status === 'Invalid' || data.status === 'Error') && hasWritePrivilege ?
                            (
                                <StatusError text={data.status}
                                             error={data.pipeline_message ? data.pipeline_message : data.validation_message}/>
                            ) : (
                                <SenNetPopover text={getStatusDefinition(data.status)} className={'status-info'}>
                                    {displayBodyHeader(data.status)}
                                </SenNetPopover>
                            )}
                        </span>

                        </h5>
                    }
                </Fragment>
            )
            }

            {(data?.doi_url || data?.publication_doi) &&
                <h5 className={"title_badge"}>
                    <span className={`${getStatusColor(data.status)} badge`}>
                        DOI: <a href={data.doi_url || data?.publication_url} className={'lnk--nodecor'} style={{color: 'white'}}>{data.registered_doi || data?.publication_doi}</a>
                        &nbsp;<ClipboardCopy text={data.registered_doi || data?.publication_doi} className={'lnk--white'} />
                    </span>
                </h5>
            }

        </Fragment>
    )
}

ViewHeaderBadges.propTypes = {
    data: PropTypes.object.isRequired,
    uniqueHeader: PropTypes.string,
    uniqueHeaderUrl: PropTypes.string,
    isMetadataHeader: PropTypes.bool
}

export { ViewHeaderBadges };

