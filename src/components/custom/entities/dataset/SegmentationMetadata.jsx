import React from 'react'
import SenNetAccordion from '@/components/custom/layout/SenNetAccordion'

function SegmentationMetadata({ data }) {
  return (
    <SenNetAccordion
                                                        title='Segmentation Channels & Quality'
                                                        id='Segmentation-Channels-Quality'
                                                        defaultExpanded={false}
                                                    >
                                                        <p>
                                                            Segmentation Channels &
                                                            Quality These channels
                                                            were used for
                                                            segmentation, which are
                                                            visible in the
                                                            visualization.
                                                            Segmentation outputs and
                                                            quality control scores
                                                            are available for each
                                                            image, with additional
                                                            segmentation information
                                                            described in the
                                                            workflow description in
                                                            the Protocols & Workflow
                                                            Details section.
                                                        </p>
                                                    </SenNetAccordion>
  )
}

export default SegmentationMetadata