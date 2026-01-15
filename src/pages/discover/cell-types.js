import dynamic from "next/dynamic";
import React, {useContext, useEffect, useState} from "react"
import {APP_TITLE} from "@/config/config"
import AppContext from "@/context/AppContext"
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"
import Col from "react-bootstrap/Col"

const AppNavbar = dynamic(() => import("../../components/custom/layout/AppNavbar"))
const Header = dynamic(() => import("../../components/custom/layout/Header"))
const Spinner = dynamic(() => import("../../components/custom/Spinner"))

function CellTypes() {
  const {logout, isRegisterHidden, isAuthorizing, isUnauthorized, hasAuthenticationCookie} = useContext(AppContext)
  return (
   <>
    <Header title={APP_TITLE + ' Cell Types'}/>
    <AppNavbar hidden={isRegisterHidden}/>
    <Container className="mb-5 d-block">
      <Row>
          <div className="py-4 d-flex bd-highlight align-items-center">
              <h1 className="m-0 flex-grow-1 bd-highlight fs-2">Cell Types</h1>
              <div className="bd-highlight">
                  <button className="btn btn-outline-primary rounded-0 clear-filter-button"
                          >
                      Search All x Cell Types
                  </button>
              </div>
          </div>
      </Row>
      <p>Explore annotated cell types across SenNet <code>Datasets</code>, 
        with insights into their anatomical distribution and associated biomarkers. 
        Visualize and compare cell type distribution across organs using interactive plots, and find datasets relevant to the cell type.</p>
    </Container>
   </>
  )
}

export default CellTypes