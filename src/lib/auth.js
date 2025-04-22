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
