import {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Container, Row, Col} from 'react-bootstrap';
import {eq, getSubtypeProvenanceShape, goIntent} from "@/components/custom/js/functions";
import {getEntityTypeQuantities, getOrganQuantities, getPrimariesQuantities} from "@/lib/services";

function SenNetStats({children}) {
    const [stats, setStats] = useState(null)
    const entities = [
        {
            color: 'yellow',
            name: 'Source'
        },
        {
            name: 'Sample'
        },
        {
            color: 'green',
            name: 'Dataset'
        },
        {
            name: 'Organ'
        },
        {
            name: 'Publication'
        },
        {
            name: 'Collection'
        },
    ]

    const animateValue = (obj, start, end, duration) => {
        let startTimestamp = null
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    const getFilter = (e) => {
        let entity = e.name
        if (eq(e.name, 'organ')) {
            entity = `Sample;sample_category=${e.name}`
        }
        if (eq(e.name, 'dataset')) {
            entity += `;data_class=Create Dataset Activity`
        }
        return `entity_type=${entity}`
    }

    const getStats = () => {
        let res = []
        let i = 0;
        for (let e of stats) {
            if (e.count) {
                res.push(
                    <Col className='snStat' key={e.name} onClick={() => goIntent(`/search?addFilters=${getFilter(e)}`)}>
                        <Row>
                            <Col className={'snStat__shape'} lg={4}>
                                <div>
                                    {getSubtypeProvenanceShape(e.name, null, 'lg')}
                                </div>
                            </Col>
                            <Col className={'snStat__meta'} lg={8}>
                                <span data-num={e.count || 0} data-js-appevent={'animVal'} className={'fs-1 snStat__num'}></span>
                                <h5>{e.name}{e.count > 1 ? 's': ''}</h5>
                            </Col>
                        </Row>
                    </Col>
                )
                i++
            }
        }
        const id = 'snStatsConfig'
        const style = `<style id=${id}>:root {--sn-stats: ${i};}</style>`
        res.push(<span key={id} dangerouslySetInnerHTML={{__html: style}}></span>)
        return res
    }

    const loadStats = async () => {
        const entityTypesCounts = await getEntityTypeQuantities()
        const organsCounts = await getOrganQuantities()

        let organs = 0
        for (let o in organsCounts) {
            organs += organsCounts[o]
        }

        entityTypesCounts['Organ'] = organs

        for (let e of entities) {
            e.count = entityTypesCounts[e.name]
        }
        setStats(entities)
        document.addEventListener(
            "animVal",
            (e) => {
                const el = e.detail.el
                animateValue(el, 0, Number(el.getAttribute('data-num')), 2000)
            },
            false,
        )
    }

    useEffect(() => {
        loadStats()

    }, [])

    return (

        <section aria-label='Statistics' className='sui-layout-body__inner'>
            <Container className='card mt-4 bg--entityWhite' fluid>
                {stats && <Row className={'snStatRow'}>
                    {getStats()}
                </Row>}
                {children}
            </Container>
        </section>
    )
}

SenNetStats.propTypes = {
    children: PropTypes.node
}

export default SenNetStats