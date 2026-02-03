import ClipboardCopy from '@/components/ClipboardCopy';
import { displayBodyHeader, getOrganMeta, getUBKGFullName } from '@/components/custom/js/functions';
import { APP_ROUTES } from "@/config/constants";
import { getOrganByCode } from "@/config/organs";
import Image from 'next/image';
import { Fragment } from 'react';

const getOrganRoute = (ruiCode) => {
    const organ = getOrganByCode(ruiCode)
    if (!organ) return
    return `${APP_ROUTES.organs}/${organ.path}`
}

function ViewHeader({ label, clId, organs }) {
    return (
        <div style={{ width: '100%' }}>
            <h4>{label}</h4>
            <h3>
                {clId}
                <ClipboardCopy text={clId} />
            </h3>

            <div className='row mb-2'>
                <div className='col-md-8 col-sm-12 entity-subtitle icon-inline'>
                    {organs &&
                        organs.length > 0 &&
                        organs.map((organ) => (
                            <Fragment key={organ}>
                                {/* Some organs don't have an organ page */}
                                {getOrganRoute(organ) ? (
                                    <a href={getOrganRoute(organ)}>
                                        <h5 className='title-badge'>
                                            <span className='badge badge-organ me-2'>
                                                {displayBodyHeader(getUBKGFullName(organ))}
                                                &nbsp;
                                                <Image
                                                    alt={''}
                                                    src={getOrganMeta(organ).icon}
                                                    width={16}
                                                    height={16}
                                                />
                                            </span>
                                        </h5>
                                    </a>
                                ) : (
                                    <h5 className='title-badge'>
                                        <span className='badge badge-organ me-2'>
                                            {displayBodyHeader(getUBKGFullName(organ))}
                                        </span>
                                    </h5>
                                )}
                            </Fragment>
                        ))}

                    <h5 className='title-badge'>
                        <span className='badge bg-secondary me-2'>{'Blood'}</span>
                    </h5>
                    <h5 className='title-badge'>
                        <span className='badge bg-secondary me-2'>{'RNA-Seq'}</span>
                    </h5>
                    <h5 className='title-badge'>
                        <span className='badge bg-secondary me-2'>{'Slide-seq'}</span>
                    </h5>
                </div>
            </div>
        </div>
    )
}

export default ViewHeader
