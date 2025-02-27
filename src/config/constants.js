export const APP_ROUTES = {
    home: "/",
    search: "/search",
    discover: "/discover",
    login: "/login",
    logout: "/logout",
    notFound: "/404",
    sample: "/sample",
    organs: "/organs",
};


export const TUTORIAL_THEME = {
    options: {
        arrowColor: '#ffffff',
        backgroundColor: '#ffffff',
        primaryColor: '#0d6efd',
        textColor: 'rgba(0, 0, 0, 0.87)',
        width: 900,
        zIndex: 1000,
    }
}

export const SWAL_DEL_CONFIG = {
    title: 'Are you sure?',
    text: 'This cannot be undone once deleted.',
    dangerMode: true,
    buttons: true,
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Keep',
    customClass: {
        cancelButton: 'btn btn-secondary',
        confirmButton: 'btn btn-danger',
    }
}