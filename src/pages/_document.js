import {Head, Html, Main, NextScript} from 'next/document'

export default function Document() {
    return (
        <Html lang='en'>
            <Head>


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



            <link rel="preload" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" as="style" onLoad="this.onload=null;this.rel='stylesheet'"/>
            <noscript>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>
            </noscript>

            {/* Bootstrap CSS */}
            <link rel="preload" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css"
                  integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi"
                  crossOrigin="anonymous"
                  as="style" onLoad="this.onload=null;this.rel='stylesheet'"/>
            <noscript>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css"
                      integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi"
                      crossOrigin="anonymous"
                />
            </noscript>
            </body>
        </Html>
    )
}
