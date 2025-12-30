import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { RecaptchaVerifier } from "firebase/auth";
import { useAuth } from '../context/AuthContext';
import { loginWithGoogle } from '../services/auth';
import { auth } from '../services/firebase';

const LoginPage = () => {
  const { user, loginWithPhone } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+52');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('PHONE'); // 'PHONE' | 'OTP'
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');

  const generateRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'normal',
      'theme': 'dark'
    });
  };

  const handleSendOtp = async () => {
    setError('');
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Ingresa un número de 10 dígitos válido');
      return;
    }
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    try {
      generateRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await loginWithPhone(fullPhoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setStep('OTP');
    } catch (err) {
      console.error("Error detallado:", err);
      if (err.code === 'auth/billing-not-enabled') {
        setError('Error: Se requiere habilitar facturación en Firebase (Plan Blaze).');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Intenta más tarde.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Número de teléfono inválido.');
      } else {
        setError('Error al enviar SMS. Intenta nuevamente.');
      }
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    try {
      await confirmationResult.confirm(otp);
    } catch (err) {
      console.error(err);
      setError('Código incorrecto');
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Gym App</h1>
        <p className="text-gray-400 mb-8">registra tu progreso.</p>
        <button
          onClick={loginWithGoogle}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition duration-300 ease-in-out transform hover:scale-105"
        >
          iniciar sesion con google
        </button>

        <div className="my-6 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-gray-600 after:mt-0.5 after:flex-1 after:border-t after:border-gray-600">
          <p className="mx-4 mb-0 text-center font-semibold text-gray-500">o usa tu celular</p>
        </div>
        <p className="text-yellow-500 text-xs text-center mb-4 -mt-2">(Opción en desarrollo)</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {step === 'PHONE' ? (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-gray-700 text-white px-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 cursor-pointer"
              >
                <option value="+52">🇲🇽 +52</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+57">🇨🇴 +57</option>
              </select>
              <input
                type="tel"
                placeholder="55 1234 5678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
              />
            </div>
            <div id="recaptcha-container" className="mx-auto"></div>
            <button
              onClick={handleSendOtp}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
            >
              Enviar Código
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Código de 6 dígitos"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest text-xl"
            />
            <button
              onClick={handleVerifyOtp}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
            >
              Verificar
            </button>
            <button
              onClick={() => setStep('PHONE')}
              className="text-gray-400 hover:text-white text-sm underline"
            >
              Cambiar número
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
