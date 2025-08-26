import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  return (
    <div>
      <button
        className="btn btn-outline-primary mb-3"
        onClick={() => navigate(-1)}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 1000,
          background: "transparent",
          border: "none",
          boxShadow: "none"
        }}
        aria-label="Retour"
      >
        <span style={{ fontSize: "2rem", color: "#0d6efd" }}>&larr;</span>
      </button>
      {/* <Navbar /> */}
      <main>
        <section>
          <h2 className="text-center mt-4">Choose Your Account Type</h2>
          <div className="container mt-5 px-4">
            <div className="row justify-content-center">
              <div className="col-md-10">
                <div className="bg-white shadow rounded-3 overflow-hidden">
                  <div className="row g-0">
                    <div className="col-md-6 border-end">
                      <Link
                        to="/registerInternaute"
                        className="p-4 d-block text-decoration-none"
                      >
                        <img
                          src="/Stem-cell research-bro.png"
                          className="img-fluid mx-auto d-block"
                          alt="Internaute"
                          style={{ maxWidth: "400px" }}
                        />
                        <h5 className="text-center mt-3">Internaute</h5>
                      </Link>
                    </div>

                    <div className="col-md-6">
                      <Link
                        to="/registerPatient"
                        className="p-4 d-block text-decoration-none"
                      >
                        <img
                          src="/Oncology patient-bro.png"
                          className="img-fluid mx-auto d-block"
                          alt="Patient"
                          style={{ maxWidth: "400px" }}
                        />
                        <h5 className="text-center mt-3">Patient</h5>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Register;