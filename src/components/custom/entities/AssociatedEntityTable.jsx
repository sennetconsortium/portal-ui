import dynamic from "next/dynamic";
import LnkIc from "../layout/LnkIc";
import { eq, getEntityViewUrl } from "../js/functions";
import ClipboardCopy from "@/components/ClipboardCopy";
import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import Card from 'react-bootstrap/Card';
import SenNetPopover from "@/components/SenNetPopover";

const DataTable = dynamic(() => import('react-data-table-component'), {
  ssr: false,
});

function AssociatedEntityTable({ id, propertyName, data }) {


  const getHotLink = (row) => {
    return getEntityViewUrl(row.entity_type?.toLowerCase(), row.uuid, {}, {})
  }

  const isPublication = eq(propertyName, 'publications')

  const getSubTitle = () => {
    let subTitle = ''
    if (Array.isArray(data.contacts) && data.contacts.length) {
      let contact = data.contacts[0]
      subTitle += `${contact.first_name} ${contact.last_name}${data.contacts.length > 1 ? ', et al.' : ''}`
    }
    if (data.publication_venue) {
      subTitle += ` | ${data.publication_venue}`
    }

    return subTitle
    
  }
  const columns = [
    {
        name: 'SenNet ID',
        id: 'sennet_id',
        width: !isPublication ? '25%' : undefined,
        selector: row => row.sennet_id,
        sortable: true,
        reorder: true,
        format: column => <span data-field='sennet_id' className='has-supIcon'><a href={getHotLink(column)}>{column.sennet_id}</a> <ClipboardCopy text={column.sennet_id} title={'Copy SenNet ID {text} to clipboard'} /></span>,
    },
    {
        name: '',
        id: 'title',
        width: '50%',
        selector: row => row.title,
        sortable: true,
        reorder: true,
        format: row => <div><a href={getHotLink(row)}><span>{row.title}</span></a><br /><span className='text-muted'>{getSubTitle()}</span></div>,
      },
      
  ]

  if (isPublication) {
    columns.push({
        name: 'Publication Date',
        id: 'publication_date',
        selector: row => row.publication_date,
        sortable: true,
        reorder: true,
        format: row => <span data-field='publication_date'>{row.publication_date}</span>,
    })
  }

  const getAssociatedEntityPluralization = () => {
    if (data[propertyName] && data[propertyName].length > 1) {
      return propertyName.upperCaseFirst()
    }
    return propertyName.upperCaseFirst().substr(0, propertyName.length - 1)
  }

  return (

    <SenNetAccordion id={id} title={`Associated ${propertyName.upperCaseFirst()}`}>
            <Card border='0'>
                <Card.Body>
                    <p className='fw-light fs-6'>This <code>{data.entity_type}</code> is contained in the following <code>{getAssociatedEntityPluralization()}</code><SenNetPopover text={ <small className="text-muted">{propertyName.upperCaseFirst()} may contain references to either raw or processed datasets. </small>}><sup><i className="bi bi-info-circle"></i></sup></SenNetPopover>.<br />
                     
                    </p>                        
                    <DataTable data={data[propertyName]} columns={columns} pagination={data[propertyName].length > 10 ? true : undefined} />
                </Card.Body>
            </Card>
        </SenNetAccordion>
  )
}

export default AssociatedEntityTable