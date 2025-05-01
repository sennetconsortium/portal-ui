import React, {Fragment, useEffect, useState} from 'react';
import {fetchProtocols, getClickableLink} from "@/components/custom/js/functions";
import SenNetAccordion from "@/components/custom/layout/SenNetAccordion";
import Card from 'react-bootstrap/Card';

const Protocols = ({protocolUrl}) => {
    const [protocolData, setProtocolData] = useState(null)

    useEffect(() =>{
        const fetchData = async () => {
            await fetchProtocols(protocolUrl).then((data) => {
                setProtocolData(data)
            });
        }
        fetchData()
    }, [])


    return (
        <SenNetAccordion title={'Protocols'}>
            {protocolData != null &&
                <Card border={'0'} className={'pb-3'}>
                    <Card.Body>
                        <Card.Subtitle
                            dangerouslySetInnerHTML={{__html: protocolData.title?.stripTags()}}/>
                    </Card.Body>
                </Card>
            }

            <Card border={'0'} className={'pb-3'}>
                <Card.Body>
                    <Card.Subtitle className={"title"}>DOI</Card.Subtitle>
                    <Card.Text>
                        <a href={getClickableLink(protocolUrl)}
                           className="icon-inline" target="_blank"><span
                            className="me-1">{protocolUrl}</span> <i className="bi bi-box-arrow-up-right"></i></a>
                    </Card.Text>
                </Card.Body>
            </Card>

            {protocolData != null &&
                <Fragment>
                    <Card border={'0'} className={'pb-3'}>
                        <Card.Body>
                            <Card.Subtitle className={"title"}>Authors</Card.Subtitle>
                            <Card.Text>
                                {protocolData.authors.map((author, index, array) => {
                                    return (
                                        <span key={index}>
                                    {author.username != "" ? (
                                            <a href={`https://www.protocols.io/researchers/${author.username}`}
                                               className="icon-inline" target="_blank">
                                                <span className="me-1">{author.name}</span> <i className="bi bi-box-arrow-up-right"></i>
                                            </a>
                                        ) :
                                        <>{author.name}</>
                                    }
                                            {index !== array.length - 1 ? <>, </> : <></>}
                                </span>
                                    );
                                })}
                            </Card.Text>
                        </Card.Body>
                    </Card>

                    <Card border={'0'} className={'pb-3'}>
                        <Card.Body>
                            <Card.Subtitle className={"title"}>Abstract</Card.Subtitle>
                            <Card.Text>
                                {JSON.parse(protocolData.description).blocks.map((block, index, array) => {
                                    return (
                                        <span key={index}>
                                            {block.text != "" &&
                                                <>{block.text}</>
                                            }
                                            {index !== array.length - 1 ? <br></br> : <></>}
                                        </span>
                                    )
                                })}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Fragment>
            }

        </SenNetAccordion>
    )

};

export default Protocols