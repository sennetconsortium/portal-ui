import {getRootURL} from "@/config/config";
import {formatMessageForCloudwatch} from "@/pages/api/find";
import {getAuthHeader, getHeadersFromRequest, getJsonHeader} from "@/lib/services";
import log from 'xac-loglevel'

export default async function handler(req, res) {
    log.debug('JSON API STARTING...')
    const uuid = req.query.uuid
    let auth = getAuthHeader({req, res})
    let headers = getJsonHeader(getHeadersFromRequest(req.headers, auth))

    let requestOptions = {
        method: 'GET',
        headers: headers
    }

    log.debug('Getting data...', uuid)
    await fetch(getRootURL() + "api/find?uuid=" + uuid, requestOptions)
        .then(response => response.json())
        .then(result => {
            log.debug('RESPONSE FROM FIND API...', formatMessageForCloudwatch(result))

            if (Object.hasOwn(result, 'error')) {
                res.status(401).json(result)
            } else {
                res.status(200).json(result)
            }
        }).catch(error => {
            log.error('ERROR IN JSON API...', formatMessageForCloudwatch(error))
            res.status(500).json(error)
        });
}
