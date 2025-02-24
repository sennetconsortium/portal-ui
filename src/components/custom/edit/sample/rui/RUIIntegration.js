import AppModal from "@/components/AppModal";
import Spinner from "@/components/custom/Spinner";
import { parseJson } from "@/lib/services";
import Script from "next/script";
import React, { Component } from "react";
import { Button, Modal } from "react-bootstrap";
import { Helmet, HelmetProvider } from "react-helmet-async";

class RUIIntegration extends Component {
    constructor(props) {
        super(props);
        this.ruiRef = React.createRef();
        this.registerButtonRef = React.createRef();
        this.state = {
            ruiLoaded: false,
            viewHeight: "90vh",
            showCancelModal: false,
        };
    }

    /**
     * Update the ccf-rui config and add a resize screen event listener
     */
    componentDidMount() {
        this.updateHeight();
        this.updateRUIConfig();
        window.addEventListener("resize", this.updateHeight.bind(this));
        window.addEventListener("beforeunload", this.beforeUnload.bind(this));
        this.registerRuiLoadListener();
    }

    /**
     * Remove event listener
     */
    componentWillUnmount() {
        window.removeEventListener("resize", this.updateHeight.bind(this));
        window.removeEventListener("resize", this.beforeUnload.bind(this));
    }

    updateHeight() {
        // Subtract navbar height from window height
        const navBars = document.getElementsByClassName("navbar");
        const footer = document.getElementById("rui-footer");
        if (navBars.length && footer) {
            const height = `${
                window.innerHeight -
                navBars[0].offsetHeight -
                footer.offsetHeight
            }px`;
            this.setState({viewHeight: height});
        }
    }

    registerRuiLoadListener() {
        const ruiRef = this.ruiRef.current;
        const ruiRefObserver = new MutationObserver((_) => {
            // Check if the register button is present, if so then the rui is loaded
            const element = ruiRef.getElementsByClassName("ccf-review-button");
            if (element.length) {
                this.ruiDidLoad();
                ruiRefObserver.disconnect();
            }
        });
        ruiRefObserver.observe(ruiRef, {childList: true});
    }

    ruiDidLoad() {
        this.setState({ruiLoaded: true});
        this.removeRegisterButton();
        this.updateHeight();
    }

    removeRegisterButton() {
        const ruiRef = this.ruiRef.current;
        const reviewButtons = ruiRef.getElementsByTagName("ccf-review-button");
        if (reviewButtons.length) {
            this.registerButtonRef.current = reviewButtons[0];
            reviewButtons[0].remove();
        }
    }

    updateRUIConfig() {
        const completeOrgan = this.props.cache.organs.find(x => x.rui_code === this.props.organ[0])
        const [_, organType, organSide] = completeOrgan['term'].match(
            /^((?:\w)+(?: \w+)?)(?: \((Right|Left)\))?$/
        );
        const sex = this.props.sex;
        const [firstName, lastName] = this.props.user.split(" ");
        const location = parseJson(this.props.blockStartLocation);
        const self = this;

        const rui = this.ruiRef.current;
        console.log(this.props.user)
        rui.baseHref = "https://cdn.humanatlas.io/ui/ccf-rui/"
        rui.user = {
            firstName: firstName || "",
            lastName: lastName || "",
            email: this.props.email || ""
        };
        rui.consortium = "SenNet"
        rui.organ = {
            ontologyId: completeOrgan["organ_uberon_url"],
            name: organType.toLowerCase(),
            sex: sex?.toLowerCase() || undefined,
            side: organSide?.toLowerCase(),
        };

        rui.register = function (tissueBlockSpatialData) {
            console.log(tissueBlockSpatialData);
            self.props.setRuiLocation(tissueBlockSpatialData);
            self.props.setShowRui(false);
        };
        rui.cancelRegistration = function () {
            self.props.setShowRui(false);
        };
        rui.editRegistration = location;
        rui.useDownload = false;
        rui.skipUnsavedChangesConfirmation = true;
    }

    clickRegister() {
        const registerButton = this.registerButtonRef.current;
        if (registerButton) {
            registerButton.getElementsByTagName("button")[0].click();
        }
    }

    beforeUnload(event) {
        event.preventDefault();
        event.returnValue = "";
    }

    render() {
        return (
            <HelmetProvider>
                <Helmet>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&amp;display=swap"
                          rel="stylesheet"/>
                    <link href="https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined"
                          rel="stylesheet"/>
                    <link href="https://cdn.humanatlas.io/ui/ccf-rui/styles.css" rel="stylesheet"/>
                </Helmet>
                <div className="webgl-content mat-typography rui">
                    <div
                        id="unityContainer"
                        style={{height: this.state.viewHeight}}
                    >
                        <ccf-rui
                            ref={this.ruiRef}
                            theme={"sennet"}
                            header={false}
                        />

                        {!this.state.ruiLoaded && (
                            <div
                                className="d-flex flex-column justify-content-center"
                                style={{height: this.state.viewHeight}}
                            >
                                <Spinner style={{margin: "auto"}}/>
                            </div>
                        )}

                        <AppModal
                            modalTitle={"Cancel Registration?"}
                            modalBody={
                                "Any changes will be lost. Are you sure you want to cancel registration?"
                            }
                            modalSize="md"
                            showModal={this.state.showCancelModal}
                            showCloseButton={true}
                            closeButtonLabel={"Close"}
                            handleClose={() =>
                                this.setState({showCancelModal: false})
                            }
                            showHomeButton={true}
                            actionButtonLabel={"Cancel Registration"}
                            handleHome={() => this.props.setShowRui(false)}
                        />

                        <Script
                            only="edit/sample"
                            type="module"
                            src="https://cdn.humanatlas.io/ui/ccf-rui/wc.js"
                        />
                    </div>
                    <Modal.Footer id="rui-footer">
                        <Button
                            variant="outline-secondary rounded-0 my-3 mx-2"
                            onClick={() =>
                                this.setState({showCancelModal: true})
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline-primary rounded-0 my-3 mx-2"
                            disabled={!this.state.ruiLoaded}
                            onClick={() => this.clickRegister()}
                        >
                            Register
                        </Button>
                    </Modal.Footer>
                </div>
            </HelmetProvider>
        );
    }
}

export default RUIIntegration;
