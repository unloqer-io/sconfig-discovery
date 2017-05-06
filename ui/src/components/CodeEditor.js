'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
const CodeMirror = require('codemirror'),
  PropTypes = React.PropTypes;
let id = 0;

export default class CodeEditor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      id: id
    };
    this.editor = null;
    id++;
  }

  setMode(mode) {
    let newOpt = this._getModeOptions(mode);
    Object.keys(newOpt).forEach((optionName) => {
      this.editor.setOption(optionName, newOpt[optionName]);
    });
  }

  _getModeOptions(modeV, _opt) {
    let opt = _opt || {},
      matchBrackets = false,
      matchClosing = false,
      mode = 'text';
    switch (modeV) {
      case 'JSON':
        mode = 'application/json';
        matchBrackets = true;
        break;
      case 'XML':
        mode = 'text/xml';
        matchBrackets = true;
        break;
      case 'SHELL':
        mode = 'text/x-sh';
        matchBrackets = false;
        break;
      case 'YAML':
        matchClosing = true;
        mode = 'text/x-yaml';
        break;
      case 'PLAIN':
        break;
    }
    opt.matchBrackets = matchBrackets;
    opt.matchClosing = matchClosing;
    opt.mode = mode;
    return opt;
  }

  _mountEditor() {
    let opt = {
      theme: 'material',
      cursorHeight: 0.8,
      tabSize: 2,
      resetSelectionOnContextMenu: false,
      lineNumbers: true,
      readOnly: this.props.readOnly || false,
      styleActiveLine: true
    };
    this._getModeOptions(this.props.mode, opt);
    if (typeof this.props.options === 'object') {
      opt = Object.assign({}, opt, this.props.options);
    }
    this.rootElement = document.getElementById('codeEditor' + this.state.id);
    this.editor = CodeMirror(this.rootElement, opt);
    this.editor.on('change', this._valueChanged.bind(this));
    this.editor.on('focus', this._handleFocus.bind(this, true));
    this.editor.on('blur', this._handleFocus.bind(this, false));
    this.editor.on('scroll', this._handleScroll.bind(this));
    this.editor.setValue(this.props.defaultValue || '');
    this.updateSize();
  }

  updateSize() {
    try {
      let $dom = $(ReactDOM.findDOMNode(this.refs.editor)),
        $paper = $dom.closest('.app-config');
      let height = $paper.height() - 104;
      if (this.props.headerSize) {
        height -= this.props.headerSize;
      }
      this.editor.setSize(undefined, height);
    } catch (e) {
    }
  }

  componentWillReceiveProps(nextProps) {
    if (typeof nextProps.options === 'object') {
      for (let optionName in nextProps.options) {
        if (nextProps.options.hasOwnProperty(optionName)) {
          this.editor.setOption(optionName, nextProps.options[optionName]);
        }
      }
    }
    if (this.props.mode !== nextProps.mode) { // we have to re-create.
      let oldMirror = this.rootElement.children[0];
      oldMirror.remove();
      this.setState({
        id: id++
      }, () => {
        this._mountEditor();
      });
      return;
    }
  }

  componentDidMount() {
    this._mountEditor();
    this._resizeHandler = this.updateSize.bind(this);
    $(window).on('paperResize', this._resizeHandler);
  }

  componentWillUnmount() {
    $(window).off('paperResize', this._resizeHandler);
  }

  getValue() {
    return this.editor.getValue();
  }

  setValue(v) {
    if (typeof v === 'object' && v) {
      v = JSON.stringify(v, null, 2);
    }
    if (typeof v !== 'string') return;
    this.editor.setValue(v);
  }

  _handleFocus(focused) {
    this.setState({
      isFocused: focused
    });
    if (focused) {
      this.props.onFocus && this.props.onFocus();
    } else {
      this.props.onBlur && this.props.onBlur();
    }
  }

  _handleScroll(cm) {
    this.props.onScroll && this.props.onScroll(cm.getScrollInfo());
  }

  _valueChanged(doc, change) {
    if (this.props.onChange && change.origin != 'setValue') {
      this.props.onChange(doc.getValue());
    }
  }

  render() {
    let tid = 'codeEditor' + this.state.id;
    return (
      <div ref="editor" className={this.props.className} id={tid}></div>
    )
  }
}

CodeEditor.PropTypes = {
  readOnly: PropTypes.bool,
  mode: PropTypes.oneOf(['JSON', 'PLAIN', 'XML', 'YAML', 'SHELL']),
  height: PropTypes.any,
  defaultValue: PropTypes.any,
  options: PropTypes.any,
  onScroll: PropTypes.func,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func
};

CodeEditor.getLabel = function (mode) {
  for (let i = 0; i < CodeEditor.MODES.length; i++) {
    let item = CodeEditor.MODES[i];
    if (item.value === mode) {
      return item.label;
    }
  }
  return mode;
};

CodeEditor.MODES = [{
  label: 'JSON',
  value: 'JSON'
}, {
  label: 'XML',
  value: 'XML'
}, {
  label: 'YAML',
  value: 'YAML'
}, {
  label: 'Shell',
  value: 'SHELL'
}, {
  label: 'Plain text',
  value: 'PLAIN'
}];