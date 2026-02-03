import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchSearchAPIEntities } from '@/lib/services'

/**
 * Hook to run a single Elasticsearch request using `fetchSearchAPIEntities`.
 * The hook waits until `body` is a truthy object and will only perform the
 * request once per hook instance. It returns `{ data, loading, error }`.
 *
 * @param {string} index - Index or service target for the request.
 * @param {Object} body - Elasticsearch request body (must be a plain object).
 * @returns {{data: any, loading: boolean, error: any}}
 */
export default function useSearchUIQuery(index, body) {
    if (!index || !body) {
        throw new Error('useSearchUIQuery requires both `index` and `body` arguments')
    }
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // track component mounted state to avoid state updates after unmount
    const mounted = useRef(true)
    useEffect(() => {
        return () => {
            mounted.current = false
        }
    }, [])

    // ensure we only fetch once per hook instance
    const fetchedOnce = useRef(false)

    // create a stable key for the provided body so we can detect presence
    // body is expected to be a plain JSON-serializable object
    const bodyKey = useMemo(() => {
        return body ? JSON.stringify(body) : null
    }, [body])

    useEffect(() => {
        // if we've already fetched, do nothing
        if (fetchedOnce.current) {
            return
        }

        // don't attempt a request until body is provided
        if (!bodyKey) {
            return
        }

        fetchedOnce.current = true

        // perform request
        let cancelled = false

        const run = async () => {
            // set loading state
            if (!mounted.current) return
            setLoading(true)
            setError(null)

            try {
                const res = await fetchSearchAPIEntities(body, index)
                if (cancelled || !mounted.current) {
                    return
                }

                // extract hits
                const hits = []
                if (res.hits) {
                    for (const hit of res.hits.hits) {
                        hits.push(hit._source)
                    }
                }

                setData({
                    hits: hits,
                    total: res.hits ? res.hits.total : 0,
                    aggregations: res.aggregations || {}
                })
            } catch (err) {
                if (cancelled || !mounted.current) {
                    return
                }
                setError(err)
                setData(null)
            } finally {
                if (cancelled || !mounted.current) {
                    return
                }
                setLoading(false)
            }
        }

        run()

        return () => {
            cancelled = true
        }
        // intentionally only run when bodyKey or index changes for first fetch
        // body is intentionally not included in deps because we use a stable serialized
        // `bodyKey` variable to determine presence/changes. Include `body` only if
        // callers pass a non-serializable object and want refetch behavior.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bodyKey, index])

    return { data, loading, error }
}
