import './style.scss'

import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/css/css'
import 'codemirror/mode/htmlmixed/htmlmixed'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/jsx/jsx'
import 'codemirror/mode/ruby/ruby'
import 'codemirror/mode/xml/xml'
import 'codemirror/addon/lint/lint.js'
import 'codemirror/addon/lint/lint.css'
import 'codemirror/addon/display/autorefresh.js'
import 'codemirror/addon/edit/closebrackets.js'
import 'codemirror/addon/edit/matchbrackets.js'
import 'codemirror/addon/fold/foldcode.js'
import 'codemirror/addon/fold/foldgutter.css'
import 'codemirror/addon/fold/foldgutter.js'
import 'codemirror/addon/fold/brace-fold.js'
import 'codemirror/theme/material.css'

import jshint from 'jshint'

export default class InlineCodeEditor {
  constructor ({ root, mode = 'javascript', theme = '', value = '', height, id, onChange = new Function}) {

    // scaffold elements
    this.element = document.createElement('section')
    this.element.classList.add('inlineCodeEditor')
    this.element.dataset.id = id

    const editorElement = document.createElement('textarea')
    this.element.appendChild(editorElement)

    // build out editor
    // NOTE: textarea must be appended before CodeMirror is initalized, otherwise: bugs.
    root.appendChild(this.element)
    editorElement.value = value
    
    let options = {
      autoCloseBrackets: true,
      autoRefresh: true,
      foldGutter: true,
      gutters: ['CodeMirror-lint-markers', 'CodeMirror-foldgutter'],
      lineNumbers: true,
      lineWrapping: true,
      matchBrackets: true,
      mode: mode,
      theme: `material inline-code-editor ${theme}`
    }
    if (mode === 'javascript') { options.lint = this.lintJavascript }
    
    this.editor = CodeMirror.fromTextArea(editorElement, options)
    this.editor.setSize('100%', height)
    this.enableCollapsibleGutters()

    this.editor.on('changes', e => onChange(e) )
  }

  addOnRunSubscriber(subscriber) {
    this.onRunSubscribers.push(subscriber)
  }

  lintJavascript(text, options) {
    options.options = Object.assign({}, options.options,
      { asi: true
      , curly: true
      , esversion: 6
      , loopfunc: true
      , shadow: 'outer'
      , strict: 'implied'
      , validthis: true
    })
    jshint.JSHINT(text, options.options, options.globals)
    return !jshint.JSHINT.data().errors ?
      [] :
      jshint.JSHINT.data().errors.map( (v) => {
        return {
          message: v.reason,
          severity: v.code[0] === 'W' ? 'warning' : 'error',
          from: CodeMirror.Pos(v.line - 1, v.character - 1),
          to: CodeMirror.Pos(v.line - 1, v.character)
        }
      })
  }

  enableCollapsibleGutters() {
    // TODO: Make button for todo
    const lintGutter = this.editor.display.gutters.querySelector('.CodeMirror-lint-markers')
    lintGutter.addEventListener('click', (e) => {
      this.editor.display.wrapper.classList.toggle('hide-the-lint')
    })
  }
  
  getValue() {
    return this.editor.getValue()
  }
  
  getMode() {
    return this.editor.options.mode
  }
}

