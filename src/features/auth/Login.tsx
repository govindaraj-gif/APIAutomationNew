import React, { useState } from 'react';
// import authService from '../services/authService';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

// const AuthModal: React.FC<AuthModalProps> = ({ onClose, onLoginSuccess }) => {
const AuthModal: React.FC<AuthModalProps> = () => {

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);
  const [directUrl, setDirectUrl] = useState('http://localhost:8080');

  const [formData, setFormData] = useState({
    email: 'admin@apitest.com',
    password: 'admin123',
    name: '',
    tenantId: '',
    tenantName: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'tenantId' ? parseInt(value, 10).toString() || '' : value,
    });
  };

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // try {
    //   const user = await authService.directLogin(directUrl, {
    //     email: formData.email,
    //     password: formData.password,
    //   });

    //   setSuccessMessage('Direct login successful! Redirecting...');
    //   setTimeout(() => {
    //     onLoginSuccess(user);
    //     onClose();
    //   }, 1500);
    // } catch (err: any) {
    //   setError(`Direct login failed: ${err.message}`);
    // } finally {
    //   setLoading(false);
    // }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
      setValidated(true);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // try {
    //   let user;

    //   if (isLogin) {
    //     user = await authService.login({
    //       email: formData.email,
    //       password: formData.password,
    //     });
    //     setSuccessMessage('Login successful! Redirecting...');
    //   } else {
    //     let tenantId = formData.tenantId;
    //     if (formData.tenantName && !tenantId) {
    //       // const tenantService = (await import('../services/tenantService')).default;
    //       // const tenantResponse = await tenantService.createTenant({ name: formData.tenantName });
    //       // tenantId = tenantResponse.id;
    //     }

    //     // user = await authService.register({
    //     //   name: formData.name,
    //     //   email: formData.email,
    //     //   password: formData.password,
    //     //   tenantId,
    //     // });

    //     setSuccessMessage('Account created successfully! Redirecting...');
    //   }

    //   setTimeout(() => {
    //     onLoginSuccess(user);
    //     onClose();
    //   }, 1500);
    // } catch (err: any) {
    //   let message = 'Authentication failed.';
    //   if (err.response?.data?.error) message = err.response.data.error;
    //   else if (err.response?.status === 404) message = 'Server not found. Try direct login.';
    //   else if ([401, 403].includes(err.response?.status)) message = 'Invalid credentials.';
    //   else if (err.message?.includes('Network Error')) message = 'Network error. Try direct login.';
    //   setError(message);
    // } finally {
    //   setLoading(false);
    // }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccessMessage(null);
    setValidated(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg relative">
        {/* <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black">&times;</button> */}
        <button className="absolute top-2 right-2 text-gray-500 hover:text-black">&times;</button>

        <h2 className="text-xl font-semibold mb-4">{isLogin ? 'Log In' : 'Create Account'}</h2>

        {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">{error}</div>}
        {successMessage && <div className="bg-green-100 text-green-700 p-2 mb-4 rounded">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="input" required />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="input" required />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="input" required />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium">Organization</label>
                <input type="text" name="tenantName" value={formData.tenantName} onChange={handleInputChange} className="input" />
              </div>

              <div>
                <label className="block text-sm font-medium">Select existing organization</label>
                <select name="tenantId" value={formData.tenantId} onChange={handleInputChange} className="input">
                  <option value="">Select</option>
                  <option value="90">Admin Organization</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (isLogin ? 'Logging in...' : 'Creating account...') : (isLogin ? 'Log In' : 'Create Account')}
          </button>

          {isLogin && (
            <div className="mt-4 border-t pt-4">
              <label className="block text-sm font-medium">Direct API URL</label>
              <input type="text" value={directUrl} onChange={(e) => setDirectUrl(e.target.value)} className="input" />
              <button type="button" onClick={handleDirectLogin} disabled={loading} className="btn-secondary w-full mt-2">
                {loading ? 'Trying direct login...' : 'Try Direct Login'}
              </button>
            </div>
          )}

          <button type="button" onClick={toggleAuthMode} className="text-blue-600 hover:underline text-sm mt-4">
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;

// import { useNavigate } from "react-router-dom";

// const Login = () => {

//   const navigate = useNavigate(); // ✅ This must be inside the component

//   const handleLogin = () => {
//     // perform login logic here
//     navigate('/api-test'); // ✅ This will navigate to another route
//   };
//   return (
//     <div className="flex items-center justify-center min-h-screen">
//         <button
//         onClick={handleLogin}
//         className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//       >
//         Login
//       </button>
//     </div>
//   );
// };

// export default Login;