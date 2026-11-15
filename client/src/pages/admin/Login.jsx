import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Field } from '../../components/Bits.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDocumentTitle } from '../../hooks/useHooks.js';

const SHOW_DEMO = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_LOGIN === 'true';

export default function Login() {
  useDocumentTitle('Ingresar al panel');
  const { isAdmin, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(SHOW_DEMO ? 'admin@cumbre.co' : '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.fields?.[0]?.message || err.message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-4xl font-extrabold" style={{ fontStretch: '85%' }}>Ingresa al panel</h1>
      <p className="mt-2 text-muted">Aquí administras los productos y los pedidos de la tienda.</p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <Field label="Correo" htmlFor="email">
          <input id="email" type="email" autoComplete="username" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Contraseña" htmlFor="password">
          <input id="password" type="password" autoComplete="current-password" className="field" value={password}
            onChange={(e) => setPassword(e.target.value)} required aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} />
        </Field>
        {error && <p id="login-error" role="alert" className="text-sm font-medium text-cherry">{error}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
      </form>

      {SHOW_DEMO && (
        <p className="mt-6 rounded-2xl bg-sunk p-4 text-sm text-muted">
          Cuenta de demostración: <strong className="text-ink">admin@cumbre.co</strong> con la contraseña <strong className="text-ink">admin1234</strong>.
        </p>
      )}
    </div>
  );
}
