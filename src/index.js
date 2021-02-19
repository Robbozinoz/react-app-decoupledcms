import './custom.scss';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <header>
    <div class="jumbotron">
    <h1 class="display-4">React Decoupled App</h1>
    <p class="lead">This react app is decoupled form a Drupal CMS. The CMS uses OAuth2 to allow CRUD actions/requests from authenticated consumers.</p>
    <hr class="my-4"/>
    <p>The CMS also contains React blocks which are progressively Decoupled from the backend in custom themes and custom modules to visit the CMS or the Decoupled JQuery app click below:</p>
    <p class="lead">
    <a class="btn btn-primary btn-lg" href="https://d8lab.gliese.thehubdigital.co" role="button">See the CMS</a>
    </p>
    <p class="lead">
    <a class="btn btn-primary btn-lg" href="https://d8app.gliese.thehubdigital.co" role="button">See the jQuery app</a>
    </p>
    </div>
    </header>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
