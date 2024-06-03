// import Addon from '.plugins/Addon'
// import GoogleTagManager from '.plugins/GoogleTagManager'
// import Ada from '.plugins/Ada'
// import Tooltip from '.plugins/Tooltip'

/**
 * JS functionality which enhance site functionality, not necessarily part of the core.
 * @param {string} source
 * @param {object} args
 * @returns
 */
function addons(source, args= null) {
    _Addon.log('Addons started ...', 'log',  'red')
    window.addons = window.addons || {}
    if (window.addons[source] !== undefined) {
        return
    }
    window.addons[source] = args

    let apps = {
        gtm: GoogleTagManager,
        ada: Ada,
        tooltip: Tooltip
    }

    setTimeout(() => {
        args = args || window.addons.init
        try {
            for (let app in apps) {
                document
                    .querySelectorAll(`[class*='js-${app}--'], [data-js-${app}]`)
                    .forEach((el) => {
                        new apps[app](el, {app, ...args })
                    })
            }

            // Default: Capture all link clicks.
            new GoogleTagManager(null, {app: 'links', ...args })
        } catch (e) {
            console.error(e)
        }
    }, 1000)

}

export default addons