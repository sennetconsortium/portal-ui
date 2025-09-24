import { getCookie } from 'cookies-next'
import log from 'loglevel'
import { Helmet, HelmetProvider } from 'react-helmet-async'

/**
 * CCFOrganInfo is a wrapper component for the CCF Organ Info.
 *
 * @param {Object} props - The properties object.
 * @param {import('@/config/organs').Organ} props.organ - The organ to display in the HRA.
 *
 * @returns {JSX.Element} The JSX code for the HumanReferenceAtlas component.
 */
const CCFOrganInfo = ({ organ }) => {
    // See https://github.com/hubmapconsortium/hra-ui/blob/47490b8b5977def6cbaed047ebda6beb9e90fb97/EMBEDDING.md?plain=1#L412
    log.debug('https://apps.humanatlas.io/api/ds-graph/sennet?primary=true&token=')
    log.debug(getCookie('groups_token'))

    // This overrides some styles in the ccf-organ-info. Allows the organ view to expand to the full width of the parent.
    const customStyles =
        '.btn {line-height: inherit !important;} .container {max-width: 100% !important;}'

    return (
        <HelmetProvider>
            <Helmet>
                <link
                    href='https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&amp;display=swap'
                    rel='stylesheet'
                />
                <link
                    href='https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined'
                    rel='stylesheet'
                />
                <link
                    href='https://cdn.humanatlas.io/ui/ccf-organ-info/styles.css'
                    rel='stylesheet'
                />
                <script
                    src='https://cdn.humanatlas.io/ui/ccf-organ-info/wc.js'
                    type="module"
                ></script>
                <style>{customStyles}</style>
            </Helmet>
            <ccf-organ-info
                organ-iri={organ.url}
                data-sources={`["https://apps.humanatlas.io/api/ds-graph/sennet?primary=true&token=${getCookie('groups_token') ? getCookie('groups_token') : ''}"]`}
                eui-url='https://data.sennetconsortium.org/ccf-eui'
                rui-url='https://apps.humanatlas.io/rui/'
                asctb-url='https://hubmapconsortium.github.io/ccf-asct-reporter/'
                hra-portal-url='https://humanatlas.io/'
                online-course-url='https://expand.iu.edu/browse/sice/cns/courses/hubmap-visible-human-mooc'
                paper-url='https://www.nature.com/articles/s41556-021-00788-6'
            />
        </HelmetProvider>
    )
}

export default CCFOrganInfo
