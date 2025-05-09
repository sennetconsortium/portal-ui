import {Head, Html, Main, NextScript} from 'next/document'

export default function Document() {
    return (
        <Html lang='en'>
            <Head>
                <link rel="stylesheet"
                      href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>
                {/* Bootstrap CSS */}
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" rel="stylesheet"
                      integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi"
                      crossOrigin="anonymous"/>

            </Head>
            <body>
            <Main/>
            <NextScript/>
            {/* Bootstrap JS */}
            <script defer src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js"
                    integrity="sha384-OERcA2EqjJCMA+/3y+gxIOqMEjwtxJY7qPCqsdltbNJuaOe923+mo//f6V8Qbsw3"
                    crossOrigin="anonymous"></script>
            <script defer src="/js/jquery-3.7.1.min.js"

                    crossOrigin="anonymous"></script>
            <script defer src="/js/main-plugins.js"
                    crossOrigin="anonymous"></script>

            </body>
        </Html>
    )
}
