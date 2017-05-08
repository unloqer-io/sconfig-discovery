'use strict';
/**
 * Console config
 */
const React = require('react'),
  config = require('config'),
  api = require('api'),
  tredux = require('tredux');

import CodeEditor from 'components/CodeEditor';

const configAct = tredux.actions('config');

class AppConfig extends React.Component {

  constructor(props) {
    super(props);
    this.handleSave = this.handleSave.bind(this);
    this.state = {
      error: null
    };
  }

  componentDidMount() {
    this.load();
  }

  load() {
    const {config} = this.props;
    api.fetch(configAct.read(config.token, config.version), (e, data) => {
      if (e) {
        return this.setState({
          error: e
        });
      }
      tredux.dispatch(configAct.setData(data));
      this.editor && this.editor.setValue(data.data);
    });
  }

  handleSave() {
    let data = this.editor.getValue();
    const {config} = this.props;
    try {
      data = JSON.parse(data);
    } catch (e) {
      return this.setState({
        error: new Error('Configuration data is not a valid JSON')
      });
    }
    this.setState({
      error: null
    });

    api.fetch(configAct.save(data, config.token, config.version), (e, res) => {
      if (e) {
        return this.setState({
          error: e
        });
      }
      tredux.dispatch(configAct.setData({
        data: data
      }));
      this.setState({
        error: new Error("Configuration saved")
      });
      this.editor && this.editor.setValue(data);
      setTimeout(() => {
        this.setState({
          error: null
        });
      }, 1000);
    });
  }

  renderError() {
    if (this.state.error) {
      return (<h5 className="align-center">
        {this.state.error.message || 'An error occurred.'}
      </h5>);
    }
  }

  renderEditor() {
    const {config} = this.props;
    if (!config.loaded) return (<h5 className="align-center">Loading...</h5>);
    if (!config.token) {
      return (
        <div style={{width: 396}} className="align-center">
          <label>Please enter the discovery token</label>
          <input
            ref={(c) => this.token = c}
            type="text"
            placeholder="Discovery token"
            id="discoveryToken"
            onBlur={() => {
              tredux.dispatch(configAct.setToken(this.token && this.token.value));
              setTimeout(() => {
                this.load();
              }, 10);
            }}
          />
        </div>
      )
    }

    let data = JSON.stringify(config.data, null, 2);
    return (
      <div className="app-config">
        <div style={{width: 250}}>
          <label>Version</label>
          <input
            ref={(c) => this.version = c}
            type="text"
            name="version"
            onBlur={() => {
              tredux.dispatch(configAct.setVersion(this.version && this.version.value));
              setTimeout(() => {
                this.load();
              }, 10);
            }}
          />
        </div>
        <CodeEditor
          ref={(c) => this.editor = c}
          heightRatio={1.8}
          className="config-editor"
          mode="JSON"
          defaultValue={data}
        />
        <div style={{marginTop: 16, textAlign: 'right'}}>
          <button
            className="button button-outline"
            onClick={() => {
              this.editor && this.editor.setValue(data);
              this.setState({
                error: null
              });
            }}>
            Cancel
          </button>
          <button
            onClick={this.handleSave}
            className="button"
          >Save
          </button>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        <h3 className="align-center" style={{marginBottom: 16}}>Discovery configuration</h3>
        {this.renderEditor()}
        {this.renderError()}
      </div>
    )
  }
}

module.exports = tredux.connect((state) => {
  return {
    config: state['config']
  }
}, AppConfig);
