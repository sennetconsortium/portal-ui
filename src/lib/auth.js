import {deleteCookie, setCookie} from "cookies-next";
import {Sui} from "search-ui/lib/search-tools";
import {getCookieDomain, STORAGE_KEY} from "@/config/config";
import {deleteFromLocalStorage} from "@/components/custom/js/functions";

export function deleteCookies() {
    setCookie('isAuthenticated', false, {sameSite: "Lax"})
    deleteCookie('groups_token')
    deleteCookie('info', {path: '/', domain: getCookieDomain(), sameSite: "Lax"})
    deleteCookie('user')
    deleteCookie('adminUIAuthorized')
    localStorage.removeItem('loginDate')
    deleteFromLocalStorage(STORAGE_KEY())
    Sui.clearFilters()
}

export const loggedInRecently = (loginDate) => {
    if (loginDate) {
        const startDate = new Date(loginDate)
        const endDate   = new Date()
        const s = (endDate.getTime() - startDate.getTime()) / 1000
        return s < 15
    }
    return false
}