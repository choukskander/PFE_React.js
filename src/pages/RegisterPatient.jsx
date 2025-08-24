import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
// Assurez-vous d'importer FontAwesome si utilisé
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

function RegisterPatient() {
  const [data, setData] = useState({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const validateForm = () => {
    let errors = {};
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

    if (!data.prenom) errors.prenom = "First name is required.";
    if (!data.nom) errors.nom = "Last name is required.";
    if (!data.email) errors.email = "Email address is required.";
    else if (!regex.test(data.email)) errors.email = "Email address is invalid.";
    if (!data.password) errors.password = "Password is required.";
    else if (data.password.length < 6) errors.password = "Password must be at least 6 characters long.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onChangeHandle = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
    console.log(data);
  };

  const onSubmitHandle = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Envoyer les données en JSON au lieu de FormData, car le backend attend du JSON
      const response = await axios.post(
        "https://pfe-express-js-2.onrender.com/api/auth/register",
        {
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          password: data.password,
          role: "patient",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(response.data);

      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        },
      });
      Toast.fire({
        icon: "success",
        title: "Registration successful! Redirecting to login...",
      });

      navigate("/login");
    } catch (error) {
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.onmouseenter = Swal.stopTimer;
          toast.onmouseleave = Swal.resumeTimer;
        },
      });
      Toast.fire({
        icon: "error",
        title: error.response?.data?.message || "An error occurred during registration.",
      });
      console.error("Error register Patient :", error.response?.data || error);
    }
  };
    const styles = {
    link: {
      color: '#0a66c2',
      textDecoration: 'none',
      fontWeight: '600',
    },
  };

  return (
    <main>
      <section className="vh-xxl-100">
        <div className="container h-100 d-flex px-0 px-sm-4 pt-1">
          <div className="row justify-content-center align-items-center m-auto">
            <div className="col-12">
              <div className="bg-mode shadow rounded-3 overflow-hidden">
                <div className="row g-0">
                  <div className="col-lg-6 d-md-flex align-items-center order-2 order-lg-1">
                    <div className="p-3 p-lg-5">
                      <img src="/signin.svg" alt="signin" />
                    </div>
                    <div className="vr opacity-1 d-none d-lg-block" />
                  </div>
                  <div className="col-lg-6 order-1">
                    <div className="p-4 p-sm-6">
                      <h1 className="mb-2 h3">Create new account</h1>
                      <p className="mb-0">
                        Already a member? <Link to="/login"style={styles.link}>Log in</Link>
                      </p>
                      <form className="mt-4 text-start" onSubmit={onSubmitHandle}>
                        <div className="mb-3">
                          <label className="form-label">First name</label>
                          <input
                            type="text"
                            className="form-control"
                            name="prenom"
                            onChange={onChangeHandle}
                          />
                          {formErrors.prenom && (
                            <div className="text-danger mt-1">
                              <i className="bi bi-exclamation-triangle"></i> {formErrors.prenom}
                            </div>
                          )}
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Last name</label>
                          <input
                            type="text"
                            className="form-control"
                            name="nom"
                            onChange={onChangeHandle}
                          />
                          {formErrors.nom && (
                            <div className="text-danger mt-1">
                              <i className="bi bi-exclamation-triangle"></i> {formErrors.nom}
                            </div>
                          )}
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Email address</label>
                          <input
                            type="email"
                            className="form-control"
                            name="email"
                            onChange={onChangeHandle}
                          />
                          {formErrors.email && (
                            <div className="text-danger mt-1">
                              <i className="bi bi-exclamation-triangle"></i> {formErrors.email}
                            </div>
                          )}
                        </div>
                        <div className="mb-3 position-relative">
                          <label htmlFor="psw-input" className="form-label">
                            Password
                          </label>
                          <input
                            className="form-control"
                            type={isPasswordVisible ? "text" : "password"}
                            id="psw-input"
                            name="password"
                            onChange={onChangeHandle}
                          />
                          <span
                            className="position-absolute top-50 end-0 translate-middle-y p-0 mt-3"
                            onClick={togglePasswordVisibility}
                            style={{ cursor: "pointer" }}
                          >
                            <FontAwesomeIcon icon={isPasswordVisible ? faEye : faEyeSlash} />
                          </span>
                          {formErrors.password && (
                            <div className="text-danger mt-1">
                              <i className="bi bi-exclamation-triangle"></i> {formErrors.password}
                            </div>
                          )}
                        </div>
                        <div>
                          <button type="submit" className="btn btn-primary w-100 mb-0">
                            Sign up
                          </button>
                        </div>
                        <div className="position-relative my-4">
                          <hr />
                          <p className="small position-absolute top-50 start-50 translate-middle bg-mode px-1 px-sm-2"></p>
                        </div>
                        <div className="text-primary-hover text-body mt-3 text-center">
                          Copyrights ©2025 Rdv-Med.
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default RegisterPatient;