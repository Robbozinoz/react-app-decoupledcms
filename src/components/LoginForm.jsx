import React, { useState, useEffect } from 'react';
import { getAuthClient } from '../utils/auth';

const auth = getAuthClient();

const LoginForm = () => {
  const [isSubmitting, setSubmitting] = useState(false);

  const [result, setResult] = useState({
    success: null,
    error: null,
    message: '',
  });

  const defaultValues = {name: '', pass: ''};
  const [values, setValues] = useState(defaultValues);

  const [isLoggedIn, setLoggedIn] = useState(false);
  // Only need to do this on first mount.
  useEffect(() => {
    auth.isLoggedIn().then((res) => {
      setLoggedIn(true);
    })
  }, []);

  const handleInputChange = (event) => {
    const {name, value} = event.target;
    setValues({...values, [name]: value});
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitting(true);

    auth.login(values.name, values.pass)
      .then(() => {
        setSubmitting(false);
        setLoggedIn(true);
        setResult({ success: true, message: 'Login success' });
      })
      .catch((error) => {
        setSubmitting(false);
        setLoggedIn(false);
        setResult({ error: true, message: `Login error: ${error.message}` });
        console.log('Login error', error);
      });
  };

  if (isLoggedIn) {
    return(
      <div>
        <p>You're currently logged in.</p>
        <button class="btn btn-success" onClick={() => auth.logout().then(setLoggedIn(false))}>
          Logout
        </button>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div>
        <p>Logging in, hold tight ...</p>
      </div>
    )
  }

  return (
    <div>
      {(result.success || result.error) &&
        <div>
          <h2>{(result.success ? 'Success!' : 'Error')}:</h2>
          {result.message}
        </div>
      }
      <form onSubmit={handleSubmit}>
          <div class="form-group">
            <input
              name="name"
              type="text"
              value={values.name}
              placeholder="Username"
              onChange={handleInputChange}
              class="form-control"
            />
          </div>
          <div class="form-group">
            <input
              name="pass"
              type="text"
              value={values.pass}
              placeholder="Password"
              onChange={handleInputChange}
              class="form-control"
            />
          </div>
          <div class="form-group">
            <input
              name="submit"
              type="submit"
              value="Login"
              class="btn btn-primary"
            />
          </div>
      </form>
    </div>
  );
};

export default LoginForm;