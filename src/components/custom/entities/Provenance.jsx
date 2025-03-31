import React, {useEffect, useState} from 'react'
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Lineage from "./sample/Lineage";
import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import ProvenanceGraph from "@/components/custom/entities/ProvenanceGraph";


function Provenance({ data, hasAncestry }) {
    const [ancestors, setAncestors] = useState(null)
    const [descendants, setDescendants] = useState(null)

    useEffect(() => {
        if (data.hasOwnProperty("descendants")) {
            setDescendants(data.descendants)
        }
        if (data.hasOwnProperty("ancestors")) {
            setAncestors(data.ancestors)
        }
    }, [hasAncestry])


    return (
        <SenNetAccordion title={'Provenance'} style={{ minHeight:'500px' }}>
            <Tabs
                defaultActiveKey="graph"
                className="c-provenance__tabs mb-3"
                variant="pills"
            >
                <Tab eventKey="graph" title="Graph" >
                    <ProvenanceGraph data={data} />
                </Tab>

                {ancestors && ancestors.length > 0 &&
                    <Tab eventKey="ancestor" title="Ancestors">
                        <Lineage lineage={ancestors}/>
                    </Tab>
                }
                {descendants && descendants.length > 0 &&
                    <Tab eventKey="descendant" title="Descendants">
                        <Lineage lineage={descendants}/>
                    </Tab>
                }
            </Tabs>
        </SenNetAccordion>
    )
}

export default Provenance
