import React, {useContext} from 'react';
import {Col, Form, Row} from 'react-bootstrap';
import {QuestionCircleFill} from "react-bootstrap-icons";
import SenNetPopover from "../../../SenNetPopover";
import AppContext from "../../../../context/AppContext";
import {equals} from "../../js/functions";

function SampleCategory({
                            organ_group_hide,
                            set_organ_group_hide,
                            data,
                            onChange,
                            sample_categories
                        }) {

    const {cache} = useContext(AppContext)
    const handleSampleCategoryChange = (e, onChange) => {
        // If sample category is 'Organ' then display the organ type input group
        if (equals(e.target.value, cache.sampleCategories.Organ)) {
            //Organ Type set display and require
            set_organ_group_hide('')
            document.getElementById("organ").setAttribute("required", "")

        } else {
            resetOrganType(e, onChange);
        }
    };
    
    const resetOrganType = (e, onChange) => {
        set_organ_group_hide('none')
        document.getElementById("organ").removeAttribute("required")
        // Empty the value of the fields and trigger onChange
        document.getElementById("organ").value = "";
        onChange(e, "organ", "")

    }

    return (
        //Sample Category
        <>
            <Form.Group className="mb-3" controlId="sample_category">
                <Form.Label>Sample Category <span
                    className="required">* </span>
                    <SenNetPopover text={<>
                        The category this <code>Sample</code> belongs to. <br />
                        <small className='popover-note text-muted mt-2'>Note: CCF Registration User Interface (CCF-RUI) tool becomes available for the <code>{cache.sampleCategories.Block} Sample</code> category where the <em>Ancestor</em> <code>Source</code> is of type <code>{cache.sourceTypes.Human}</code> or <code>{cache.sourceTypes['Human Organoid']}</code>.</small>
                    </>}>
                        <QuestionCircleFill/>
                    </SenNetPopover>

                </Form.Label>

                <Form.Select required aria-label="Sample Category"
                             onChange={e => {
                                 handleSampleCategoryChange(e, onChange);
                                 onChange(e, e.target.id, e.target.value)
                             }}
                             defaultValue={data.sample_category}>
                    <option value="">----</option>
                    {Object.entries(sample_categories).map(sample_category => {
                        return (
                            <option key={sample_category[0]} value={sample_category[0]}>
                                {sample_category[1]}
                            </option>
                        );

                    })}
                </Form.Select>
            </Form.Group>

            {/*Organ Type*/}
            <Form.Group as={Row} className="mb-3" id="organ_group"
                        style={{display: organ_group_hide}}>
                <Form.Label column sm="2">Organ Type <span
                    className="required">*</span></Form.Label>
                <Col sm="10">
                    <Form.Select aria-label="Organ Type" id="organ" onChange={e => {
                        onChange(e, e.target.id, e.target.value)
                    }}
                                 defaultValue={data.organ}>
                        <option value="">----</option>
                        {Object.entries(cache.organTypes).map(op => {
                            return (
                                <option key={op[0]} value={op[0]}>
                                    {op[1]}
                                </option>
                            );

                        })}
                    </Form.Select>
                </Col>

            </Form.Group>
        </>
    )

}

export default SampleCategory