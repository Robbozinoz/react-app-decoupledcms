/**
 * @file
 *
 * Wrapper around fetch(), and OAuth access token handling operations.
 *
 * To use import getAuthClient, and initialize a client:
 * const auth = getAuthClient(optionalConfig);
 */

const refreshPromises = [];

/**
 * OAuth client factory.
 *
 * @param {object} config
 *
 * @returns {object}
 * Returns an object of functions with $config injected.
 */
export function getAuthClient(config = {}) {
  const defaultConfig = {
    // Base URL of your Drupal site.
    base: 'https://d8lab.gliese.thehubdigital.co',
    // Name to use when storing the token in localStorage.
    token_name: 'drupal-oauth-token',
    // OAuth client ID - get from Drupal.
    client_id: 'c39e242b-a9d2-4108-b157-34568fdd15ed',
    // OAuth client secret - set in Drupal.
    client_secret: 'eI#5QTK*6J2U',
    // Drupal user role related to this OAuth client.
    scope: 'creator',
    // Margin of time before the current token expires that we should force a
    // token refresh.
    expire_margin: 0,
  };

  config =  {...defaultConfig, ...config}

  /**
   * Exchange a username & password for an OAuth token.
   *
   * @param {string} username 
   * @param {string} password 
   */
  async function login(username, password) {
    let formData = new FormData();
    formData.append('grant_type', 'password');
    formData.append('client_id', config.client_id);
    formData.append('client_secret', config.client_secret);
    formData.append('scope', config.scope);
    formData.append('username', username);
    formData.append('password', password);
    try {
      const response = await fetch(`${config.base}/oauth/token`, {
        method: 'post',
        headers: new Headers({
          'Accept': 'application/json',
        }),
        body: formData,
      });
      const data = await response.json();
      if (data.error) {
        console.log('Error retrieving token', data);
        return Promise.reject(new Error(`Error retrieving OAuth token: ${data.error}`));
      }
      return saveToken(data);
    }
    catch (err) {
      console.log('API got an error', err);
      return Promise.reject(new Error(`API error: ${err}`));
    }
  };

  /**
   * Delete the stored OAuth token, effectively ending the user's session.
   */
  function logout() {
    localStorage.removeItem(config.token_name);
    return Promise.resolve(true);
  };

  /**
   * Wrapper for fetch() that will attempt to add a Bearer token if present.
   *
   * If there's a valid token, or one can be obtained via a refresh token, then
   * add it to the request headers. If not, issue the request without adding an
   * Authorization header.
   *
   * @param {string} url URL to fetch.
   * @param {object} options Options for fetch().
   */
  async function fetchWithAuthentication(url, options) {
    if (!options.headers.get('Authorization')) {
      const oauth_token = await token();
      if (oauth_token) {
        console.log('using token', oauth_token);
        options.headers.append('Authorization', `Bearer ${oauth_token.access_token}`);
      }
    }

    return fetch(`${config.base}${url}`, options);
  }

  /**
   * Get the current OAuth token if there is one.
   *
   * Get the OAuth token form localStorage, and refresh it if necessary using
   * the included refresh_token.
   *
   * @returns {Promise}
   *   Returns a Promise that resolves to the current token, or false.
   */
  async function token() {
    const token = localStorage.getItem(config.token_name) !== null
      ? JSON.parse(localStorage.getItem(config.token_name))
      : false;

    if (!token) {
      Promise.reject();
    }

    const { expires_at, refresh_token } = token;
    if (expires_at - config.expire_margin < Date.now()/1000) {
      return refreshToken(refresh_token);
    }
    return Promise.resolve(token);
  };

  /**
   * Request a new token using a refresh_token.
   *
   * This function is smart about reusing requests for a refresh token. So it is
   * safe to call it multiple times in succession without having to worry about
   * whether a previous request is still processing.
   */
  function refreshToken(refresh_token) {
    console.log("getting refresh token");
    if (refreshPromises[refresh_token]) {
      return refreshPromises[refresh_token];
    }

    // Note that the data in the request is different when getting a new token
    // via a refresh_token. grant_type = refresh_token, and do NOT include the
    // scope parameter in the request as it'll cause issues if you do.
    let formData = new FormData();
    formData.append('grant_type', 'refresh_token');
    formData.append('client_id', config.client_id);
    formData.append('client_secret', config.client_secret);
    formData.append('refresh_token', refresh_token);

    return(refreshPromises[refresh_token] = fetch(`${config.base}/oauth/token`, {
      method: 'post',
      headers: new Headers({
        'Accept': 'application/json',
      }),
      body: formData,
      })
      .then(function(response) {
        return response.json();
      })
      .then((data) => {
        delete refreshPromises[refresh_token];

        if (data.error) {
          console.log('Error refreshing token', data);
          return false;
        }
        return saveToken(data);
      })
      .catch(err => {
        delete refreshPromises[refresh_token];
        console.log('API got an error', err)
        return Promise.reject(err);
      })
    );
  }

  /**
   * Store an OAuth token retrieved from Drupal in localStorage.
   *
   * @param {object} data 
   * @returns {object}
   *   Returns the token with an additional expires_at property added.
   */
  function saveToken(data) {
    let token = Object.assign({}, data); // Make a copy of data object.
    token.date = Math.floor(Date.now() / 1000);
    token.expires_at = token.date + token.expires_in;
    localStorage.setItem(config.token_name, JSON.stringify(token));
    return token;
  }

  /**
   * Check if the current user is logged in or not.
   *
   * @returns {Promise}
   */
  async function isLoggedIn() {
    const oauth_token = await token();
    if (oauth_token) {
      return Promise.resolve(true);
    }
    return Promise.reject(false);;
  };

  /**
   * Run a query to /oauth/debug and output the results to the console.
   */
  function debug() {
    const headers = new Headers({
      Accept: 'application/vnd.api+json',
    });

    fetchWithAuthentication('/oauth/debug?_format=json', {headers})
      .then((response) => response.json())
      .then((data) => {
        console.log('debug', data);
      });
  }

  return {debug, login, logout, isLoggedIn, fetchWithAuthentication, token, refreshToken};
}