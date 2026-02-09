import {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import Dropdown from 'react-bootstrap/Dropdown'
import AppContext from "../../../../context/AppContext";
import {getEntityViewUrl} from "../../js/functions";
import SenNetPopover, {SenPopoverOptions} from "@/components/SenNetPopover";
import {fetchRevisions} from "@/lib/services";

function VersionDropdown({className = '', data}) {

    const {_t, cache} = useContext(AppContext)
    const [revisions, setRevisions] = useState([])
    const [isBusy, setIsBusy] = useState(false)

    useEffect(() => {
        const getRevisions = async () => {
            setIsBusy(true)
            let json = await fetchRevisions(data.uuid)
            if (json != null) {
                setRevisions(json)
            }
            setIsBusy(false)
        }

        getRevisions()
    }, [])

    const buildRevisions = () => {
        let results = [];
        const setUrl = (_entity) => {
            if (data.uuid === _entity.uuid) return '#'
            return getEntityViewUrl(cache.entities.dataset, _entity.uuid, {isEdit: false}, {})
        }

        const getActive = (_entity) => setUrl(_entity) === '#' ? true : null

        for (let r of revisions) {
            results.push(
                <Dropdown.Item active={getActive(r)} key={`version-${r.revision_number}`} href={setUrl(r)}
                               title={r.dataset.sennet_id}>Version {r.revision_number}</Dropdown.Item>
            )
        }
        return results;
    }

    const getActiveRevision = () => {
        for (let r of revisions) {
            if (data.uuid === r.uuid) {
                return r.revision_number
            }
        }
    }

    const getMostRecentRevision = () => {
        return revisions[0]['revision_number']
    }

    if (isBusy || (!isBusy && revisions.length <= 1)) {
        return <></>
    }

    return (
        <SenNetPopover
            placement={SenPopoverOptions.placement.top}
            trigger={'always'}
            text={getMostRecentRevision() !== getActiveRevision() ? 'This is not the most recent version of this dataset.' : ''}
        >
            <Dropdown className={className}>
                <Dropdown.Toggle id="dropdown-basic"
                                 variant={getMostRecentRevision() !== getActiveRevision() ? 'danger' : 'primary'}>
                    Version {getActiveRevision()}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                    {buildRevisions()}
                </Dropdown.Menu>
            </Dropdown>
        </SenNetPopover>
    )
}

VersionDropdown.propTypes = {
    data: PropTypes.object
}

export default VersionDropdown
