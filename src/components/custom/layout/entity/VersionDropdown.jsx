import {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import Dropdown from 'react-bootstrap/Dropdown'
import AppContext from "../../../../context/AppContext";
import {getEntityViewUrl, getHeaders} from "../../js/functions";
import SenNetPopover, {SenPopoverOptions} from "@/components/SenNetPopover";
import {getEntityEndPoint} from "@/config/config";

function VersionDropdown({className = '', data}) {

    const {_t, cache} = useContext(AppContext)
    const [revisions, setRevisions] = useState([])
    const [isBusy, setIsBusy] = useState(false)

    useEffect(() => {
        const fetchRevisions = async () => {
            setIsBusy(true)
            let response = await fetch(getEntityEndPoint() + `datasets/${data.uuid}/revisions?include_dataset=true`, {
                method: 'GET',
                headers: getHeaders()
            })
            if (response.ok) {
                let json = await response.json()
                setRevisions(json)
            }
            setIsBusy(false)
        }

        fetchRevisions()
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
