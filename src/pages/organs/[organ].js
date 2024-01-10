import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import SidebarBtn from "../../components/SidebarBtn";
import NotFound from "../../components/custom/NotFound";
import AppFooter from "../../components/custom/layout/AppFooter";
import AppNavbar from "../../components/custom/layout/AppNavbar";
import DataTypeQuantities from "../../components/custom/organ/DataTypeQuantities";
import Samples from "../../components/custom/organ/Samples";
import OrganViewHeader from "../../components/custom/organ/ViewHeader";
import AppContext from "../../context/AppContext";
import useOrganDetail from "../../hooks/organ/useOrganDetail";
import HumanReferenceAtlas from "../../components/custom/organ/HumanReferenceAtlas";

const Organ = () => {
    const { isRegisterHidden } = useContext(AppContext);

    const router = useRouter();
    const { organ } = router.query;
    const { organDetail } = useOrganDetail(organ);

    if (organDetail == null) {
        return NotFound();
    }

    return (
        <>
            <AppNavbar hidden={isRegisterHidden} signoutHidden={false} />
            <div className="container-fluid">
                <div className="row flex-nowrap entity_body">
                    {/* Sidebar */}
                    <div className="col-auto p-0">
                        <div
                            id="sidebar"
                            className="collapse collapse-horizontal sticky-top custom-sticky"
                        >
                            <ul
                                id="sidebar-nav"
                                className="nav list-group rounded-1 text-sm-start"
                            >
                                <li className="nav-item">
                                    <a
                                        href="#HumanReferenceAtlas"
                                        className="nav-link "
                                        data-bs-parent="#sidebar"
                                    >
                                        Human Reference Atlas
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a
                                        href="#DataTypes"
                                        className="nav-link "
                                        data-bs-parent="#sidebar"
                                    >
                                        Data Types
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a
                                        href="#Samples"
                                        className="nav-link "
                                        data-bs-parent="#sidebar"
                                    >
                                        Samples
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <main className="col m-md-3 entity_details">
                        <SidebarBtn />

                        {/* Title and badges */}
                        <OrganViewHeader organ={organDetail} />

                        {/* Human Reference Atlas */}
                        <HumanReferenceAtlas id="HumanReferenceAtlas" uberonUrl={organDetail.uberonUrl}/>

                        {/* Data Types */}
                        <DataTypeQuantities
                            id="DataTypes"
                            ruiCode={organDetail.ruiCode}
                        />

                        {/* Sample */}
                        <Samples id="Samples" ruiCode={organDetail.ruiCode} />
                    </main>
                </div>
            </div>
            <AppFooter />
        </>
    );
};

export default Organ;
