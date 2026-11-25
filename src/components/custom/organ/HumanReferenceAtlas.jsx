import SenNetAccordion from '@/components/custom/layout/SenNetAccordion'
import CCFOrganInfo from './CCFOrganInfo'

/**
 * HumasReferenceAtlas (HRA) component displays the HRA in a SenNetAccordion.
 *
 * @param {Object} props - The properties object.
 * @param {string} props.id - The id of the SenNetAccordion.
 * @param {import('@/config/organs').Organ} props.organ - The organ to display in the HRA.
 *
 * @returns {JSX.Element} The JSX code for the HumanReferenceAtlas component.
 */
const HumanReferenceAtlas = ({ id, organ }) => {
    return (
        <SenNetAccordion
            id={id}
            title='Human Reference Atlas'
            afterTitle={undefined}
        >
            <CCFOrganInfo organ={organ} />
        </SenNetAccordion>
    )
}

export default HumanReferenceAtlas
