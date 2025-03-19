/**
 * JS functionality which enhance site functionality, not necessarily part of the core.
 * @param {string} source
 * @param {object} args
 * @returns
 */
function addons(source, args= null) {
    Addon.log(`Addons started ... ${source}`, {color: 'white'})
    window.addons = window.addons || {}
    if (window.addons[source] !== undefined) {
        return
    }
    window.addons[source] = args

    let apps = {
        searchErrorBoundary: SearchErrorBoundary,
        gtm: GoogleTagManager,
        ada: Ada,
        tooltip: Tooltip
    }

    args = args || window.addons.init
    Addon.observeMutations(apps, args)

    setTimeout(() => {
        try {
            // Default: Capture all link clicks.
            new GoogleTagManager(null, {app: 'links', ...args })
        } catch (e) {
            console.error(e)
        }
    }, 1200)

}

export default addons