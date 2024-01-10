import SenNetAccordion from '../layout/SenNetAccordion'
import CCFOrganInfo from './CCFOrganInfo'

const HumanReferenceAtlas = ({ id, uberonUrl }) => {
    return (
        <SenNetAccordion
            id={id}
            title='Human Reference Atlas'
            afterTitle={undefined}
        >
            <CCFOrganInfo uberonUrl={uberonUrl} />
        </SenNetAccordion>
    )
}

export default HumanReferenceAtlas
