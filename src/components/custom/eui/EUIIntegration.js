import Script from "next/script";
import {getCookie} from "cookies-next";
import {Helmet, HelmetProvider} from "react-helmet-async";
import {getRootURL} from "@/config/config";

const EUIIntegration = () => {
    return (
        <HelmetProvider>
            <Helmet>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&amp;display=swap"
                      rel="stylesheet"/>
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined"
                      rel="stylesheet"/>
                <link href="https://cdn.humanatlas.io/ui/ccf-eui/styles.css" rel="stylesheet"/>
            </Helmet>
            <ccf-eui
                theme="sennet"
                data-sources={`["https://apps.humanatlas.io/api/ds-graph/sennet?token=${getCookie('groups_token') ? getCookie('groups_token') : ''}"]`}
                base-href="https://cdn.humanatlas.io/ui/ccf-eui/"
                logo-tooltip="SenNet Data Sharing Portal"
                login-disabled="true"
                home-url={getRootURL() + "search"}
            />

            <Script
                only="ccf-eui"
                type="module"
                src="https://cdn.humanatlas.io/ui/ccf-eui/wc.js"
            />
        </HelmetProvider>
    );
};

export default EUIIntegration;
