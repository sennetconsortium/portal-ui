/**
 * JS functionality which enhance site functionality, not necessarily part of the core.
 * @param {string} source
 * @param {object} args
 * @returns
 */
function addons(source, args= null) {
    Addon.log('Addons started ...', {color: 'white'})
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

    let observedApps = {
        searchErrorBoundary: SearchErrorBoundary,
    }

    args = args || window.addons.init
    Addon.observeMutations(observedApps, args)

    setTimeout(() => {

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
    }, 1200)

}

export default addons