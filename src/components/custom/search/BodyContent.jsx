import { Results } from '@elastic/react-search-ui'
import { useSearchUIContext } from "search-ui/components/core/SearchUIContext";
import Spinner from '@/components/custom/Spinner'

function BodyContent({ view }) {
    const { wasSearched, filters, rawResponse } = useSearchUIContext()

    return (
        <div
            className='js-gtm--results sui-resultsTable'
            data-js-ada='tableResults'
            data-ada-data='{"trigger": ".rdt_TableCell", "tabIndex": ".rdt_TableRow"}'
        >
            {wasSearched && <Results filters={filters} titleField={filters} rawResponse={rawResponse} view={view} />}
            {!wasSearched && <Spinner />}
        </div>
    )
}

export default BodyContent
