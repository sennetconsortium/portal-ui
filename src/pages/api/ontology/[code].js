import path from 'path'
import {promises as fs} from 'fs'
import log from 'xac-loglevel'
import {getOnotologyValueset} from '@/lib/ontology'

const ONTOLOGY_CACHE_PATH = path.join(process.cwd(), 'cache')

export default async function handler(req, res) {
    const key = req.query.code
    const errMsg = `ONTOLOGY API: Misconfiguration detected for UBKG with key ${key}`
    try {
        const filePath = ONTOLOGY_CACHE_PATH + '/.ontology_' + key
        const filePathBackUp = filePath + '_bk'
        log.debug('ONTOLOGY API > Beginning cache fetching process ... ', filePath)
        let ontology
        let ontologyBackUp

        const createFile = async (filePath, data) => {
            await fs.mkdir(path.dirname(filePath), {recursive: true}).then(function () {
                fs.writeFile(filePath, JSON.stringify(data), 'utf8')
            })
        }

        try {
            // This is always expected to exist at build time
            ontology = await fs.readFile(filePath, 'utf8')
            if (ontology) {
                ontology = JSON.parse(ontology)
            }

            // Look for a backup or create (in catch) if it does not exist
            ontologyBackUp = await fs.readFile(filePathBackUp, 'utf8')
            if (ontologyBackUp) {
                ontologyBackUp = JSON.parse(ontologyBackUp)
            }

        }  catch (e) {
            log.debug(`ONTOLOGY API > Error encountered on code ${key}: ${e}`)
            if (ontology && ontology.length) {
                // Create a backup of what's there already
                await createFile(filePathBackUp, ontology)
            } else {
                log.debug(`ONTOLOGY API > No cache exists ${filePath}`)

                ontology = await getOnotologyValueset(key)
                if (ontology && ontology.length) {
                    log.debug(`ONTOLOGY API > get_onotology_valueset obtained on ${key}`)
                    await createFile(filePath, ontology)
                }
            }
        }

        if (ontology && ontology.length) {
            res.status(200).json(ontology)
            return
        } else {
            if (ontologyBackUp && ontologyBackUp.length) {
                res.status(200).json(ontologyBackUp)
                return 
            } else {
                console.warn(errMsg)
                res.status(404).json([])
            }
        }
    } catch (error) {
        console.error(`ONTOLOGY API`, error)
    }
    console.warn(errMsg)
    res.status(404).json([])
}