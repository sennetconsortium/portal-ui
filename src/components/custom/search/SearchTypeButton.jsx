import { APP_ROUTES } from "@/config/constants";
import {useSearchUIContext} from "@/search-ui/components/core/SearchUIContext";
import {useEffect, useState} from "react";
import {eq} from "@/components/custom/js/functions";

const SearchTypeButton = ({ title }) => {
    const { filters } = useSearchUIContext()
    const [links, setLinks] = useState(<></>)

    const validButtons = {
        Entities: APP_ROUTES.search,
        Metadata: APP_ROUTES.search + "/metadata",
        Files: APP_ROUTES.search + "/files"
    }

    const onCondition = (b) => {
        let entity
        let canShow = true
        if (eq(b, 'metadata')) {

            for (let i = 0; i < filters.length; i++) {
                if (eq(filters[i].field, 'entity_type') && ['Dataset', 'Sample', 'Source'].contains(filters[i].values[0])) {
                    entity = filters[i].values[0]
                }

                if (eq(filters[i].field, 'sample_category') && eq(filters[i].values[0], 'organ')) {
                    canShow = false
                    break;
                }
            }

        }
        return {entity, canShow}
    }

    const buildLinks = () => {
        let res = []
        for (let b in validButtons) {
            let condition = onCondition(b)
            if (!eq(title, b) && condition.canShow) {
                res.push (
                    <a key={b} className="btn btn-outline-primary rounded-0 w-100 js-searchType mt-2"
                       href={`${validButtons[b]}${condition.entity ? `?addFilters=entity_type=${condition.entity}` : ''}`}>
                        Search {b}
                    </a>
                );
            }

        }

        setLinks(res)
    };

    useEffect(() => {
        buildLinks()
    }, [filters]);

    return (
        <>{links}</>
    );
};

export default SearchTypeButton;
