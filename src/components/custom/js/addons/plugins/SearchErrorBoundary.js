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
        const error = this.el.html().trim()
        if (error.contains("The globus token in the HTTP 'Authorization: Bearer <globus-token>' header is either invalid or expired")) {
            this.getComponent('token')
        } else {
            this.getComponent('notFound')
        }

    }


}