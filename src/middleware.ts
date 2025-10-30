// middleware.ts
import type {NextRequest} from 'next/server'
import {NextResponse} from 'next/server'
import {fetchEntityType} from './lib/services.js'
import {REDIRECT_COOKIE_KEY} from './config/constants.js'

// Direct the user to the correct entity type view/edit page
async function entityRewrites(request: NextRequest) {
    let uuid = request.nextUrl.searchParams.get("uuid")

    if (uuid) {
        // Check for redirect cookie and if it exists just continue
        // Check if user is trying to create entity
        if (request.cookies.get('redirect')?.value === "true" || uuid === 'register') {
            const response = NextResponse.rewrite(request.url)
            response.cookies.delete("redirect")
            return response
        }

        let entity_type = await fetchEntityType(uuid, request.cookies.get('groups_token')?.value);

        if (entity_type === "404") {
            return NextResponse.rewrite(new URL('/404', request.url))
        } else if (entity_type != "") {
            let updated_url = request.url.replace(/(source|sample|dataset|upload|collection|epicollection|publication)/, entity_type)
            if (!updated_url.includes('_next')) {
                updated_url = decodeURIComponent(updated_url)
                updated_url = updated_url[updated_url.length - 1] === '/' ? updated_url : updated_url
            }
            const response = NextResponse.redirect(updated_url)
            response.cookies.set("redirect", "true")
            return response
        }
    }
    return NextResponse.rewrite(request.url)
}

async function afterLoginRewrites(request: NextRequest) {
    // Redirect to home page without query string
    // Only redirect the user after a login action
    let fromGlobus = request.nextUrl.searchParams.get("globus")
    const page = request.cookies.get(REDIRECT_COOKIE_KEY)?.value
    if (fromGlobus) {
        let info = request.cookies.get('info')?.value
        let groupsToken
        if (info) {
            info = atob(info)
            const userInfo = JSON.parse(info)
            groupsToken = userInfo.groups_token
        }
        let url = new URL('/', request.url)
        if ( page && (!page?.includes('//') && !page?.includes('www.'))) {
            url = new URL(page, request.url)
        }
        const response = NextResponse.redirect(url)
        response.cookies.set('groups_token', groupsToken)
        return response
    }

    return NextResponse.rewrite(request.url)
}

export async function middleware(request: NextRequest) {

    // Match view and edit entity pages and grab the correct entity type
    if (request.nextUrl.pathname.match(/((?:source|sample|dataset|upload|collection|epicollection|publication).*)/)
        || request.nextUrl.pathname.match(/edit\/((?:source|sample|dataset|upload|collection|epicollection|publication).*)/)) {
        return entityRewrites(request)
    }

    const loginRedirect = afterLoginRewrites(request)

    if (loginRedirect) {
        return loginRedirect
    }

    return NextResponse.rewrite(request.url)
}

export const config = {
    matcher: '/(.*)',
    // Need to make exceptions for lodash
    // https://nextjs.org/docs/messages/edge-dynamic-code-evaluation
    unstable_allowDynamic: [
        '/node_modules/lodash*/**',
        '/node_modules/babel-runtime/**'
    ]
}
