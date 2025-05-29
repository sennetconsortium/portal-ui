import Link from "next/link";
import { APP_ROUTES } from "@/config/constants";
import {useSearchUIContext} from "@/search-ui/components/core/SearchUIContext";
import {useEffect, useState} from "react";
import {eq} from "@/components/custom/js/functions";

const SearchDropdown = ({ title }) => {
    const { filters } = useSearchUIContext()
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        console.log('SearchDropdown', filters)
        let canShow = false
        for (let i = 0; i < filters.length; i++) {
            if (eq(filters[i].field, 'entity_type') && ['Dataset', 'Sample', 'Source'].contains(filters[i].values[0])) {
                canShow = true
            }

            if (eq(filters[i].field, 'sample_category') && eq(filters[i].values[0], 'organ')) {
                canShow = false
                break;
            }
        }
        setVisible(canShow)
    }, [filters]);

    const dropdownItems = [
        { name: "Entities", url: APP_ROUTES.search },
        { name: "Metadata", url: APP_ROUTES.discover + "/metadata" },
    ];

    const createLinkView = (item) => {
        if (item.name === title) {
            return null;
        }
        return (
            <a key={item.name} className="btn btn-outline-primary rounded-0 w-100 js-searchType mt-2" href={item.url}>
                Search {item.name}
            </a>
        );
    };

    if (!visible) return <></>

    return (
        <>{dropdownItems.map((item) => {
            return createLinkView(item);
        })}</>
    );
};

export default SearchDropdown;
