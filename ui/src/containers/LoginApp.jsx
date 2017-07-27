'use strict';
/**
 * Login application
 */
const React = require('react'),
  config = require('config'),
  api = require('api'),
  qs = require('querystring'),
  tredux = require('tredux');

const UNLOQ_LOGIN_SCRIPT = 'https://plugin.unloq.io/login.js';

const authAct = tredux.actions('auth');

class LoginApp extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      error: null
    };
  }

  componentDidMount() {
    api.fetch(authAct.check(), (e) => {
      if (e) return this.mount();
      window.location.href = '/ui';
    });

  }

  mount() {
    // create the UNLOQ login script
    const tag = document.createElement("script");
    tag.src = UNLOQ_LOGIN_SCRIPT;
    tag.setAttribute('data-unloq-global', 'true');
    this.unloq.appendChild(tag);
    let booted = false,
      self = this;

    function done() {
      if (booted) return;
      booted = true;
      if (!window.UNLOQ) return;
      window.UNLOQ.onLogin(self.handleLogin.bind(self));
    }

    tag.onload = done;
    tag.onerror = done;
  }

  handleLogin(data, fn) {
    api.fetch(authAct.login(data.token), (e, result) => {
      if (e) {
        return this.setState({
          error: e
        }, fn);
      }
      window.location.href = '/ui';
    });
  }

  renderError() {
    const {error} = this.state;
    if (!error) return;
    let code = error.code || 'SERVER_ERROR',
      message = error.message || 'An unexpected error occurred';
    if (code === 'TOKEN.INVALID' || code === 'TOKEN.EXPIRED') {
      message = 'This login link has expired. Please try again';
    }
    return (
      <div>
        {message}
      </div>
    );
  }

  render() {
    return tredux.mount(
      <div className={classNames("login-app", {
        "has-error": !!this.state.error
      })}>
        <div className="login-app-error">
          {this.renderError()}
        </div>
        <div className="unloq-wrapper" ref={(c) => this.unloq = c}>
        </div>
      </div>
    )
  }

}

module.exports = LoginApp;
