import React from "react";
import Head from 'next/head'

const Header = ({title}) => {
    return (
        <Head>
            <title>{title}</title>
            <link rel="icon" href="/favicon.ico"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <meta name="google-site-verification" content="m72fbKEuY_H6kYypUVFuYcUl6fnapQvPVFUIMRw5NhU" />
        </Head>
    )
}

export default Header
