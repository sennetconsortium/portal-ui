import { Helmet, HelmetProvider } from 'react-helmet-async'

const CCFOrganInfo = ({ uberonUrl }) => {
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
                    rel='stylesheet'
                    href='https://cdn.jsdelivr.net/gh/hubmapconsortium/ccf-ui@3/organ-info/styles.css'
                />
                <script src='https://cdn.jsdelivr.net/gh/hubmapconsortium/ccf-ui@3/organ-info/wc.js'></script>
                <style>{customStyles}</style>
            </Helmet>
            <ccf-organ-info
                organ-iri={uberonUrl}
                use-remote-api='true'
                remote-api-endpoint='https://apps.humanatlas.io/sennet-hra-api/v1'
            />
        </HelmetProvider>
    )
}

export default CCFOrganInfo
