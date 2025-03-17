import {formatMessageForCloudwatch} from "./find";
import {getProtocolId} from "../../components/custom/js/functions";
import log from "loglevel";

export default async function handler(req, res) {
    let baseProtocolUrl = 'https://www.protocols.io/api/v4/protocols/'
    let protocolId = getProtocolId(decodeURIComponent(req.query.uri))
    log.info('ProtocolId', protocolId)

    await fetch(baseProtocolUrl + protocolId, {
        headers: {
            'Authorization': 'Bearer ' + process.env.PROTOCOLS_TOKEN,
        },
        method: 'GET'
    })
        .then(response => response.json())
        .then(result => {
            if(result['status_code'] === 0){
                res.status(200).json(result.payload)
            } else {
                 res.status(400).json({status_text: result['status_text']})
            }
        }).catch(error => {
            log.error('ERROR IN PROTOCOL API...', formatMessageForCloudwatch(error))
            res.status(400).json(error)
        })
}