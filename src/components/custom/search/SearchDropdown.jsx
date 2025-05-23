import Link from "next/link";
import { APP_ROUTES } from "@/config/constants";

const SearchDropdown = ({ title }) => {
    const dropdownItems = [
        { name: "Entities", url: APP_ROUTES.search },
        { name: "Metadata", url: APP_ROUTES.discover + "/metadata" },
    ];

    const createLinkView = (item) => {
        if (item.name === title) {
            return null;
        }
        return (
            <Link key={item.name} className="dropdown-item" href={item.url}>
                Search {item.name}
            </Link>
        );
    };

    return (
        <div className="dropdown sui-layout-sidebar-dropdown">
            <button
                className="btn btn-outline-primary rounded-0 dropdown-toggle w-100"
                type="button"
                id="searchDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
            >
                Search {title}
            </button>
            <ul className="dropdown-menu" aria-labelledby="searchDropdown">
                {dropdownItems.map((item) => {
                    return createLinkView(item);
                })}
            </ul>
        </div>
    );
};

export default SearchDropdown;
