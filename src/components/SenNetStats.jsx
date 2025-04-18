import {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Container, Row, Col} from 'react-bootstrap';
import {getSubtypeProvenanceShape, goIntent} from "@/components/custom/js/functions";
import {getEntityTypeQuantities, getOrganQuantities} from "@/lib/services";

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

    const getStats = () => {
        let res = []
        for (let e of stats) {
           res.push(
               <Col className='snStat' key={e.name} onClick={() => goIntent(`/search?addFilters=entity_type=${e.name}`)}>
                    <Row>
                        <Col className={'snStat__shape'} lg={4}>
                            <div>
                                {getSubtypeProvenanceShape(e.name, null, 'lg')}
                            </div>
                        </Col>
                        <Col className={'snStat__meta'} lg={8}>
                            <span data-num={e.count} data-js-appevent={'animVal'} className={'fs-1 snStat__num'}></span>
                            <h5>{e.name}{e.count > 1 ? 's': ''}</h5>
                        </Col>
                    </Row>
                </Col>
           )
        }
        return res
    }

    const loadStats = async () => {
        const entityTypesCounts = await getEntityTypeQuantities()
        const organsCounts = await getOrganQuantities()

        let organs = 0
        for (let o in organsCounts) {
            organs += organsCounts[o]
        }

        for (let e of entities) {
            e.count = entityTypesCounts[e.name] || organs
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