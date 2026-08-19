import React from "react";
import Head from 'next/head'

const Header = ({title, description, jsonLD, canonical}) => {
    return (
        <Head>
            <title>{title}</title>
            <link rel="icon" href="/favicon.ico"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <meta name="google-site-verification" content="m72fbKEuY_H6kYypUVFuYcUl6fnapQvPVFUIMRw5NhU" />
            {description && <meta name="description" content={description} />}
            {canonical && <link rel="canonical" href={canonical} />}
            {jsonLD && <script type="application/ld+json">{JSON.stringify(jsonLD)}</script>}
        </Head>
    )
}

export default Header
