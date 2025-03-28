/**
 * This displays our own components when @elastic/react-search-ui spits an error from search
 */
class SearchErrorBoundary extends Addon {
    constructor(el, args) {
        super(el, args)
        this.prettyError()
    }

    getComponent(key) {
        try {
            const data = JSON.parse(atob(this.el.data('components')))
            if (Addon.isLocal()) {
                console.log('SearchErrorBoundary', data)
            }
             if (data[key]) {
                 this.el.removeClass('sui-search-error alert alert-danger ')
                 this.el.html(data[key])
             }
        } catch (e) {

        }
    }

    prettyError() {
        const error = this.el.html().trim().toLowerCase()
        if (error.contains("header is either invalid or expired")) {
            this.getComponent('token')
        } else {
            this.getComponent('notFound')
        }
    }


}