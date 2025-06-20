import { APP_ROUTES } from "@/config/constants";
import {useSearchUIContext} from "@/search-ui/components/core/SearchUIContext";
import {useEffect, useState} from "react";
import {eq} from "@/components/custom/js/functions";

const SearchTypeButton = ({ title }) => {
    const { filters } = useSearchUIContext()
    const [visible, setVisible] = useState(true)
    const [entity, setEntity] = useState('Dataset')

    useEffect(() => {
        if (eq(title, 'metadata')) {
            let e;
            let canShow = false
            for (let i = 0; i < filters.length; i++) {
                if (eq(filters[i].field, 'entity_type') && ['Dataset', 'Sample', 'Source'].contains(filters[i].values[0])) {
                    e = filters[i].values[0]
                    canShow = true
                }

                if (eq(filters[i].field, 'sample_category') && eq(filters[i].values[0], 'organ')) {
                    canShow = false
                    break;
                }
            }
            setEntity(e)
            setVisible(canShow)
        }

    }, [filters]);

    const validButtons = {
        Entities: APP_ROUTES.search,
        Metadata: APP_ROUTES.search + "/metadata"
    }

    const createLinkView = (url) => {
        return (
            <a className="btn btn-outline-primary rounded-0 w-100 js-searchType mt-2" href={`${url}?addFilters=entity_type=${entity}`}>
                Search {title}
            </a>
        );
    };

    if (!visible) return <></>

    return (
        <>{createLinkView(validButtons[title])}</>
    );
};

export default SearchTypeButton;
