'use strict';
/**
 * Console application
 */
const React = require('react'),
  api = require('api'),
  tredux = require('tredux');

import AppConfig from './AppConfig';
const authAct = tredux.actions('auth');
class ConsoleApp extends React.Component {
  render() {
    return tredux.mount(
      <div className={classNames("console-app")}>
        <button
          onClick={() => {
            api.fetch(authAct.logout(), () => {
              window.location.href = '/';
            });
          }}
          style={{marginRight: '10%'}}
          className="float-right button button-black button-outline">LOGOUT
        </button>
        <AppConfig />
      </div>
    )
  }
}

module.exports = ConsoleApp;