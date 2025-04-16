import {useContext, useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Card, Container, Row, Col, Button} from 'react-bootstrap';
import {getSubtypeProvenanceShape, goIntent} from "@/components/custom/js/functions";

function SenNetStats({children}) {
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
        for (let e of entities) {
           res.push(
               <Col className='snStat' key={e.name} onClick={() => goIntent(`/search?addFilters=entity_type=${e.name}`)}>
                    <Row>
                        <Col lg={4}>
                            <div>
                                {getSubtypeProvenanceShape(e.name, null, 'lg')}
                            </div>
                        </Col>
                        <Col lg={8}>
                            <span data-num={Math.floor(Math.random() * 1000)} data-js-appevent={'animVal'} className={'fs-1 snStat__num'}></span>
                            <h5>{e.name}s</h5>
                        </Col>
                    </Row>
                </Col>
           )
        }
        return res
    }
    useEffect(() => {
        document.addEventListener(
            "animVal",
            (e) => {
                const el = e.detail.el
                animateValue(el, 0, Number(el.getAttribute('data-num')), 5000)
            },
            false,
        )
    }, [])

    return (

        <section aria-label='Statistics' className='sui-layout-body__inner'>
            <Container className='card mt-4 bg--entityWhite' fluid>
                <Row className={'snStatRow'}>
                    {getStats()}
                </Row>
            </Container>
        </section>
    )
}

SenNetStats.propTypes = {
    children: PropTypes.node
}

export default SenNetStats