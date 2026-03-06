import {useEffect, useState} from 'react'
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import {log} from 'xac-loglevel'

function useVitessceEncoder() {

    const [url, setUrl] = useState(null)
    const [vitessceConfigFromUrl, setVitessceConfigFromUrl] = useState(null)

    const CURRENT_VERSION = '0.0.1';
    const VITESSCE_CONF_QUERY_STRING = 'vitessce_conf';
    const VERSION_QUERY_STRING = 'vitessce_conf_version';
    const LENGTH_QUERY_STRING = 'vitessce_conf_length';

    const MAX_BROWSER_URL_LENGTHS = {
        Chrome: 32779,
        Other: 2047,
        Edge: 2047,
        Safari: 65000,
        Firefox: 65000,
    };

    function decodeURLParamsToConf(queryString) {
        const params = new URLSearchParams(queryString.replace('#', '&'));
        const compressedConfString = params.get(VITESSCE_CONF_QUERY_STRING);
        const expectedConfLength = Number(params.get(LENGTH_QUERY_STRING));
        if (expectedConfLength !== compressedConfString.length) {
            log.error(`Compressed conf length (${compressedConfString.length}) != expected (${expectedConfLength}). URL truncated?`);
        }
        const version = params.get(VERSION_QUERY_STRING);
        if (version === CURRENT_VERSION) {
            const conf = JSON.parse(decompressFromEncodedURIComponent(compressedConfString));
            setVitessceConfigFromUrl(conf)
            return conf;
        }
        log.error('Unrecognized URL Param Version');
    }

    function whichBrowser() {
        const agent = navigator.userAgent;
        if (agent.includes('Chrome')) return 'Chrome';
        else if (agent.includes('Firefox')) return 'Firefox';
        else if (agent.includes('Safari')) return 'Safari';
        else if (agent.includes('Edge')) return 'Edge';
        else return 'Other';
    }

    function  getUrlByLengthMaximums(params, base) {
        base = base || document.location.href.split('#')[0]
        const url = `${base}#${params}`
        const browser = whichBrowser()
        return (url.length > MAX_BROWSER_URL_LENGTHS[browser]) ? base : url
    }

    function encodeConfigToUrl(_config) {
        const compressedConf = compressToEncodedURIComponent(JSON.stringify(_config));
        const newParams = `${LENGTH_QUERY_STRING}=${compressedConf.length}&${VERSION_QUERY_STRING}=${CURRENT_VERSION}&${VITESSCE_CONF_QUERY_STRING}=${compressedConf}`;
        setUrl(newParams)
        log.info('VitParams', newParams)
        return newParams
    }

    useEffect(() => {
        if (window.location.hash.startsWith('#vitessce_conf_')) {
            decodeURLParamsToConf(window.location.hash)
        }

    }, [])

    //const url = encodeConfInUrl(config, fn)
    return {encodeConfigToUrl, decodeURLParamsToConf, vitessceConfigFromUrl, url,  getUrlByLengthMaximums}
}

export default useVitessceEncoder