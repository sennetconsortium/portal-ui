import { APP_ROUTES } from '@/config/constants';
import { getOrganByCode, organIcons } from "@/config/organs";
import AppContext from "@/context/AppContext";
import { Avatar, Chip, Stack } from "@mui/material";
import { useContext } from 'react';
import { Card } from 'react-bootstrap';
import DataTable from "react-data-table-component";
import { displayBodyHeader, getUBKGFullName } from "../../js/functions";
import SenNetAccordion from "../../layout/SenNetAccordion";

export default function Tissue({ data }) {
    const {cache} = useContext(AppContext)

    const columns = [
        {
            name: 'Organ',
            selector: row => getUBKGFullName(row.origin_samples[0]?.organ),
            width: '30%',
            wrap: true,
            format: row => {
                const name = getUBKGFullName(row.origin_samples[0]?.organ)
                const code = cache.organTypesCodes[name]
                const organ = getOrganByCode(code)
                const icon = organIcons[code] || organIcons.OT
                let path
                if (organ) {
                    path = `${APP_ROUTES.organs}/${organ?.path}`
                }

                return (
                    <span title={name}>
                        {path && <a href={path}>{name}</a>}
                        {!path && <span>{name}</span>}
                        <img alt={name} src={icon} width={'24px'} />
                    </span>
                )
            },
        },
        {
            name: 'Category',
            selector: row => row.sample_category,
            width: '20%',
            format: row => {
                return (
                    <span>
                        {row.sample_category ? displayBodyHeader(row.sample_category) : ''}
                    </span>
                )
            }
        },
        {
            name: 'Tissue Location',
            selector: row => row.rui_location,
            wrap: true,
            width: '50%',
            omit: data && data.rui_location ? data.rui_location?.length <= 0 : true,
            format: row => {
                return <div>The <a href={`/api/json?view=${btoa(JSON.stringify(row.rui_location))}`} target={'_blank'}>spatial coordinates of this sample</a> have been registered and it can be found in the <a target={'_blank'} href={'/ccf-eui'}>Common Coordinate Framework Exploration User Interface</a>.</div>
            }
        }
    ]

    const anatomicalLocations = () => {
        let result = []
        for (let r of data.rui_location_anatomical_locations) {
            result.push(<span key={r.label}><Chip label={r.label} size='small' onClick={() => window.open(r.purl, '_blank')}  /></span>)
        }
        return result;
    }

    return (
        <>
            <SenNetAccordion title={'Tissue'}>
                <Card border='0' className='mb-2 pb-2'>
                    <DataTable className={'rdt_Table--puffy'} columns={columns} data={[data]} />

                    {data && data.rui_location_anatomical_locations && <SenNetAccordion className={'mt-3 accordion-nested'} title={'Anatomical Locations'} id={'anatomical-locations'}>
                        <Card border='0' className='mb-2 pb-2'>
                             <Stack direction="row" spacing={1}>
                                {anatomicalLocations()}
                            </Stack>
                        </Card>
                    </SenNetAccordion>}
                </Card>
            </SenNetAccordion>


        </>
    )

}
