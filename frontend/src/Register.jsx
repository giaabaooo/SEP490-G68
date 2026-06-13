import React, { useState } from 'react';
import './Register.css';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  // state quản lý vai trò: 'candidate' (Ứng viên) hoặc 'employer' (Nhà tuyển dụng)
  const [role, setRole] = useState('candidate');

  // state quản lý bước: 1 (Điền form) hoặc 2 (Nhập OTP)
  const [step, setStep] = useState(1);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    companyName: '',
    size: '',
    address: ''
  });

  const [otp, setOtp] = useState(Array(6).fill(''));
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOtpChange = (value, index) => {
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];

    newOtp[index] = value;

    setOtp(newOtp);

    if (value && index < 5) {
      setTimeout(() => {
        document
          .getElementById(`otp-${index + 1}`)
          ?.focus();
      }, 0);
    }
  };

  const handleOtpKeyDown = (
    e,
    index
  ) => {
    if (
      e.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      document
        .getElementById(`otp-${index - 1}`)
        ?.focus();
    }

    if (
      e.key === 'ArrowLeft' &&
      index > 0
    ) {
      document
        .getElementById(`otp-${index - 1}`)
        ?.focus();
    }

    if (
      e.key === 'ArrowRight' &&
      index < 5
    ) {
      document
        .getElementById(`otp-${index + 1}`)
        ?.focus();
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      setError('');

      const endpoint =
        role === 'candidate'
          ? 'http://localhost:5000/api/auth/register'
          : 'http://localhost:5000/api/auth/register-business';

      const body =
        role === 'candidate'
          ? {
              fullName: formData.fullName,
              email: formData.email,
              password: formData.password
            }
          : {
              fullName: formData.fullName,
              email: formData.email,
              password: formData.password,
              companyName: formData.companyName
            };

      const registerRes =
        await fetch(
          endpoint,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json'
            },
            body:
              JSON.stringify(
                body
              )
          }
        );

      const registerData =
        await registerRes.json();

      if (!registerRes.ok) {
        throw new Error(
          registerData.message
        );
      }

      setStep(2);

    } catch (err) {
      setError(
        err.message ||
          'Đăng ký thất bại'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);

      setError('');

      const res =
        await fetch(
          'http://localhost:5000/api/auth/verify-otp',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json'
            },
            body:
              JSON.stringify({
                email:
                  formData.email,
                otp:
                  otp.join('')
              })
          }
        );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data.message
        );
      }

      localStorage.setItem(
        'token',
        data.token
      );

      alert(
        'Đăng ký thành công'
      );

      navigate('/home');

    } catch (err) {
      setError(
        err.message ||
          'OTP không hợp lệ'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">

        {/* === CỘT TRÁI === */}
        <div className="register-left">

          <div className="brand">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M20 7H16V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
                fill="#1d4ed8"
              />
            </svg>

            <span className="brand-name">
              Careerio
            </span>
          </div>

          <h1 className="title">
            Đánh giá thực chất.
            Kết nối chính xác.
          </h1>

          <p className="desc">
            Hệ sinh thái Marketplace hỗ trợ ứng tuyển và tuyển dụng dựa trên năng lực thực chiến.
          </p>

        </div>

        <div className="divider"></div>

        {/* === CỘT PHẢI === */}
        <div className="register-right">

          <div className="tabs">

            <div
              className="tab"
              onClick={() =>
                navigate(
                  '/login'
                )
              }
            >
              Đăng nhập
            </div>

            <div className="tab active">
              Đăng ký
            </div>

          </div>

          {error && (
            <p
              style={{
                color: 'red',
                marginBottom:
                  '15px'
              }}
            >
              {error}
            </p>
          )}

          {step === 1 ? (

            /* === BƯỚC 1: FORM ĐĂNG KÝ === */

            <form
              className="form"
              onSubmit={
                handleRegister
              }
            >

              <div className="input-group">
                <label>
                  Họ và tên
                </label>

                <input
                  type="text"
                  name="fullName"
                  value={
                    formData.fullName
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="input-group">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="input-group">
                <label>
                  Mật khẩu
                </label>

                <input
                  type="password"
                  name="password"
                  value={
                    formData.password
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-submit"
              >
                {
                  loading
                    ? 'Đang xử lý...'
                    : 'Tạo tài khoản'
                }
              </button>

            </form>

          ) : (

            /* === BƯỚC 2: NHẬP MÃ OTP (Ảnh 3) === */

            <div className="otp-step">

              <h2 className="otp-title">
                Bước 2:
                Xác thực mã OTP
              </h2>

              <p className="otp-desc">
                Chúng tôi đã gửi mã đến:
                <strong>
                  {' '}
                  {formData.email}
                </strong>
              </p>

              <div className="otp-inputs">
                {[...Array(6)].map(
                  (_, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength="1"
                      className="otp-box"
                      value={
                        otp[index]
                      }
                      onChange={(e) =>
                        handleOtpChange(
                          e.target.value,
                          index
                        )
                      }
                      onKeyDown={(e) =>
                        handleOtpKeyDown(
                          e,
                          index
                        )
                      }
                    />
                  )
                )}
              </div>

              <p className="otp-timeout">
                Mã hết hạn trong
                5 phút
              </p>

              <button
                className="btn-submit"
                onClick={
                  handleVerifyOtp
                }
              >
                {
                  loading
                    ? 'Đang xác thực...'
                    : 'Xác nhận'
                }
              </button>

            </div>

          )}

        </div>
      </div>
    </div>
  );
};

export default Register;