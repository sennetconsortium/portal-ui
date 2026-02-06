import ClipboardCopy from '@/components/ClipboardCopy'
import { displayBodyHeader, getOrganMeta, getUBKGFullName } from '@/components/custom/js/functions'
import { APP_ROUTES } from '@/config/constants'
import { getOrganByCode } from '@/config/organs'
import Image from 'next/image'
import { Fragment, useMemo } from 'react'

const getOrganRoute = (ruiCode) => {
    const organ = getOrganByCode(ruiCode)
    if (!organ) return
    return `${APP_ROUTES.organs}/${organ.path}`
}

function ViewHeader({ label, clId, organs }) {
    const organObjs = useMemo(() => {
        if (!organs) {
            return []
        }

        return organs
            ?.map((organ) => {
                return {
                    code: organ,
                    icon: getOrganMeta(organ).icon,
                    label: displayBodyHeader(getUBKGFullName(organ)),
                    url: getOrganRoute(organ)
                }
            })
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [organs])

    return (
        <div style={{ width: '100%' }}>
            <h4>{label}</h4>
            <h3>
                {clId}
                <ClipboardCopy text={clId} />
            </h3>

            <div className='row mb-2'>
                <div className='col-md-8 col-sm-12 entity-subtitle icon-inline'>
                    {organObjs &&
                        organObjs.map((organ) => (
                            <Fragment key={organ.code}>
                                {organ.url ? (
                                    <a href={organ.url}>
                                        <h5 className='title-badge'>
                                            <span className='badge badge-organ me-2'>
                                                {organ.label}
                                                &nbsp;
                                                <Image
                                                    alt={''}
                                                    src={organ.icon}
                                                    width={16}
                                                    height={16}
                                                />
                                            </span>
                                        </h5>
                                    </a>
                                ) : (
                                    <h5 className='title-badge'>
                                        <span className='badge badge-organ me-2'>
                                            {organ.label}
                                        </span>
                                    </h5>
                                )}
                            </Fragment>
                        ))}
                </div>
            </div>
        </div>
    )
}

export default ViewHeader
